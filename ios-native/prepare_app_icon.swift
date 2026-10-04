import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// App Store icons must not contain an alpha channel. Preserve the source logo;
// write an opaque PNG without changing its colors or using lossy JPEG conversion.
guard CommandLine.arguments.count == 3 else { fatalError("Usage: prepare_app_icon.swift source.png output.png") }
let source = URL(fileURLWithPath: CommandLine.arguments[1])
let destination = URL(fileURLWithPath: CommandLine.arguments[2])
guard let input = CGImageSourceCreateWithURL(source as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(input, 0, nil),
      let context = CGContext(data: nil, width: 1024, height: 1024, bitsPerComponent: 8,
                              bytesPerRow: 4096, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                              bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { fatalError("Cannot load/render App icon") }
let rect = CGRect(x: 0, y: 0, width: 1024, height: 1024)
context.setFillColor(CGColor(gray: 1, alpha: 1))
context.fill(rect)
context.draw(image, in: rect)
guard let opaqueImage = context.makeImage() else { fatalError("Cannot make opaque App icon") }
let data = NSMutableData()
guard let output = CGImageDestinationCreateWithData(data, UTType.png.identifier as CFString, 1, nil) else { fatalError("Cannot encode App icon") }
CGImageDestinationAddImage(output, opaqueImage, nil)
guard CGImageDestinationFinalize(output) else { fatalError("Cannot finalize App icon") }
try data.write(to: destination, options: .atomic)
