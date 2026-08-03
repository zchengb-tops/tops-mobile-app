const SUPPORTED = new Set([
  'sina', 'zhihu', 'sspai', 'xiaoyuzhou', 'stock',
  'doubanMovie', 'bilibili', 'nnGroup', 'tiobe', 'history',
]);

const getChannelComponent = (channel) =>
  SUPPORTED.has(channel?.channelCode || channel?.id) ? {} : undefined;

const isAppSupportedChannel = (channel) =>
  Boolean(channel?.isRss) || Boolean(getChannelComponent(channel));

const sanitizeChannelsForApp = (channelList = []) =>
  channelList.map((channel) =>
    isAppSupportedChannel(channel) ? channel : {...channel, enable: false}
  );

const resolveIcon = (channel) => {
  if (typeof channel.renderIcon === 'function') return 'component-icon';
  if (channel.iconUrl) return 'remote-icon';
  return 'placeholder';
};

const arenaFromProdSync = {
  id: 13,
  channelCode: 'arena',
  tabTitle: 'Arena',
  iconUrl: null,
  isRss: false,
  enable: true,
};

const sanitized = sanitizeChannelsForApp([arenaFromProdSync]);
console.assert(sanitized[0].enable === false, 'arena must be disabled for app');
console.assert(resolveIcon({...sanitized[0], renderIcon: undefined}) === 'placeholder', 'missing icon must not call renderIcon');
console.assert(resolveIcon({renderIcon: () => null}) === 'component-icon', 'mapped icon still works');
console.assert(resolveIcon({iconUrl: 'https://x/a.svg'}) === 'remote-icon', 'remote icon fallback works');
console.assert(isAppSupportedChannel({isRss: true, enable: true}) === true, 'rss stays supported');
console.log('channel-sanitize-check ok');
