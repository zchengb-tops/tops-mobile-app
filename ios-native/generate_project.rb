#!/usr/bin/env ruby
require 'xcodeproj'
require 'fileutils'
require 'json'
require 'base64'

root = File.dirname(__FILE__)
project = Xcodeproj::Project.new(File.join(root, 'InfoHub.xcodeproj'))
app = project.new_target(:application, 'InfoHub', :ios, '17.0')
group = project.main_group.new_group('InfoHub', 'InfoHub')
Dir.glob(File.join(root, 'InfoHub', '*.swift')).sort.each { |file| app.add_file_references([group.new_file(File.basename(file))]) }
%w[terms.txt privacy.txt].each do |name|
  source = name == 'terms.txt' ? 'UserServiceAgreementScreen.js' : 'UserPrivacyAgreementScreen.js'
  text = File.read(File.join(root, '../src/screens', source)).scan(/<Text\b[^>]*>(.*?)<\/Text>/m).flatten.map do |paragraph|
    paragraph.gsub("{'\\n'}", "\n").gsub(/^\s+/, '').strip
  end.join("\n\n")
  File.write(File.join(root, 'InfoHub', name), text + "\n")
  app.resources_build_phase.add_file_reference(group.new_file(name))
end
assets = File.join(root, 'InfoHub/Assets.xcassets/AppIcon.appiconset')
FileUtils.mkdir_p(assets)
FileUtils.cp(File.join(root, '../assets/logo.png'), File.join(assets, 'AppIcon.png'))
File.write(File.join(assets, 'Contents.json'), JSON.pretty_generate({images: [{filename: 'AppIcon.png', idiom: 'universal', platform: 'ios', size: '1024x1024'}], info: {author: 'xcode', version: 1}}))
app.resources_build_phase.add_file_reference(group.new_file('Assets.xcassets'))
{sina: 'weibo', zhihu: 'zhihu', sspai: 'sspai', arena: 'arena', xiaoyuzhou: 'xiaoyuzhou', stock: 'stock', doubanMovie: 'douban', bilibili: 'bilibili', nnGroup: 'nngroup', tiobe: 'tiobe', history: 'history'}.each do |code, source|
  directory = File.join(root, "InfoHub/Assets.xcassets/channel-#{code}.imageset")
  FileUtils.mkdir_p(directory)
  FileUtils.cp(File.join(root, "../assets/icons/#{source}.svg"), File.join(directory, 'logo.svg'))
  File.write(File.join(directory, 'Contents.json'), JSON.pretty_generate({images: [{filename: 'logo.svg', idiom: 'universal'}], info: {author: 'xcode', version: 1}, properties: {'preserves-vector-representation': true, 'template-rendering-intent': code == :arena ? 'template' : 'original'}}))
end
kr_directory = File.join(root, 'InfoHub/Assets.xcassets/channel-36kr.imageset')
FileUtils.mkdir_p(kr_directory)
kr_image = File.read(File.join(root, '../src/components/Kr36Logo.js'))[/data:image\/png;base64,([^']+)/, 1]
File.binwrite(File.join(kr_directory, 'logo.png'), Base64.strict_decode64(kr_image))
File.write(File.join(kr_directory, 'Contents.json'), JSON.pretty_generate({images: [{filename: 'logo.png', idiom: 'universal'}], info: {author: 'xcode', version: 1}}))
app.build_configurations.each do |config|
  config.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => config.name == 'Debug' ? 'cn.zchengb.infohub.native' : 'cn.zchengb.infohub',
    'INFOPLIST_FILE' => 'InfoHub/Info.plist',
    'SWIFT_VERSION' => '5.0',
    'TARGETED_DEVICE_FAMILY' => '1,2',
    'MARKETING_VERSION' => '1.3',
    'CURRENT_PROJECT_VERSION' => '24',
    'ASSETCATALOG_COMPILER_APPICON_NAME' => 'AppIcon',
    'ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME' => '',
    'CODE_SIGN_STYLE' => 'Automatic',
    'ENABLE_USER_SCRIPT_SANDBOXING' => 'YES'
  })
end
tests = project.new_target(:unit_test_bundle, 'InfoHubTests', :ios, '17.0')
tests.add_dependency(app)
test_group = project.main_group.new_group('InfoHubTests', 'InfoHubTests')
Dir.glob(File.join(root, 'InfoHubTests', '*.swift')).sort.each { |file| tests.add_file_references([test_group.new_file(File.basename(file))]) }
tests.build_configurations.each do |config|
  config.build_settings.merge!({'SWIFT_VERSION' => '5.0', 'GENERATE_INFOPLIST_FILE' => 'YES', 'PRODUCT_BUNDLE_IDENTIFIER' => 'cn.zchengb.infohub.tests', 'TEST_HOST' => '$(BUILT_PRODUCTS_DIR)/InfoHub.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/InfoHub', 'BUNDLE_LOADER' => '$(TEST_HOST)'})
end
ui_tests = project.new_target(:ui_test_bundle, 'InfoHubUITests', :ios, '17.0')
ui_tests.add_dependency(app)
ui_group = project.main_group.new_group('InfoHubUITests', 'InfoHubUITests')
Dir.glob(File.join(root, 'InfoHubUITests', '*.swift')).sort.each { |file| ui_tests.add_file_references([ui_group.new_file(File.basename(file))]) }
ui_tests.build_configurations.each do |config|
  config.build_settings.merge!({'SWIFT_VERSION' => '5.0', 'GENERATE_INFOPLIST_FILE' => 'YES', 'PRODUCT_BUNDLE_IDENTIFIER' => 'cn.zchengb.infohub.uitests', 'TEST_TARGET_NAME' => 'InfoHub'})
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.set_launch_target(app)
scheme.add_test_target(tests)
scheme.add_test_target(ui_tests)
scheme.save_as(project.path, 'InfoHub', true)
