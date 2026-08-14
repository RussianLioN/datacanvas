import CoreGraphics
import Foundation
import ImageIO

struct RenderArguments {
    let input: String
    let output: String
    let expectedPages: Int
    let pageWidth: Int
    let pageHeight: Int
    let scale: Int
}

enum RenderError: Error, CustomStringConvertible {
    case usage
    case invalidValue(String)
    case pdfOpenFailed
    case pageMissing(Int)
    case pageSizeMismatch(Int, CGFloat, CGFloat)
    case contextFailed
    case imageFailed
    case writeFailed

    var description: String {
        switch self {
        case .usage:
            return "использование: swift scripts/render-presentation-link-lisa-pdf-slides.swift --input <pdf> --output <png> --expected-pages 3 --page-width 960 --page-height 540 --scale 4"
        case .invalidValue(let name):
            return "\(name): неверное значение"
        case .pdfOpenFailed:
            return "PDF не открыт"
        case .pageMissing(let page):
            return "страница \(page) не найдена"
        case .pageSizeMismatch(let page, let width, let height):
            return "страница \(page) имеет размер \(Int(width))x\(Int(height)), ожидается 960x540"
        case .contextFailed:
            return "не удалось создать bitmap context"
        case .imageFailed:
            return "не удалось создать CGImage"
        case .writeFailed:
            return "PNG не записан"
        }
    }
}

func parseArguments(_ arguments: [String]) throws -> RenderArguments {
    var values: [String: String] = [:]
    var index = 0
    while index < arguments.count {
        let key = arguments[index]
        guard key.hasPrefix("--"), index + 1 < arguments.count else { throw RenderError.usage }
        values[key] = arguments[index + 1]
        index += 2
    }
    guard
        let input = values["--input"],
        let output = values["--output"],
        let expectedPages = Int(values["--expected-pages"] ?? ""),
        let pageWidth = Int(values["--page-width"] ?? ""),
        let pageHeight = Int(values["--page-height"] ?? ""),
        let scale = Int(values["--scale"] ?? "")
    else {
        throw RenderError.usage
    }
    guard expectedPages > 0 else { throw RenderError.invalidValue("--expected-pages") }
    guard pageWidth > 0 else { throw RenderError.invalidValue("--page-width") }
    guard pageHeight > 0 else { throw RenderError.invalidValue("--page-height") }
    guard scale > 0 else { throw RenderError.invalidValue("--scale") }
    return RenderArguments(
        input: input,
        output: output,
        expectedPages: expectedPages,
        pageWidth: pageWidth,
        pageHeight: pageHeight,
        scale: scale
    )
}

func assertClose(_ actual: CGFloat, _ expected: CGFloat) -> Bool {
    return abs(actual - expected) < 0.01
}

func render(_ arguments: RenderArguments) throws {
    let inputUrl = URL(fileURLWithPath: arguments.input)
    let outputUrl = URL(fileURLWithPath: arguments.output)
    guard let document = CGPDFDocument(inputUrl as CFURL) else {
        throw RenderError.pdfOpenFailed
    }
    guard document.numberOfPages == arguments.expectedPages else {
        throw RenderError.invalidValue("--expected-pages")
    }

    let targetPageWidth = arguments.pageWidth * arguments.scale
    let targetPageHeight = arguments.pageHeight * arguments.scale
    let canvasWidth = targetPageWidth
    let canvasHeight = targetPageHeight * arguments.expectedPages
    let bytesPerPixel = 4
    let bytesPerRow = canvasWidth * bytesPerPixel
    var bitmap = Data(count: bytesPerRow * canvasHeight)
    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) ?? CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue

    try bitmap.withUnsafeMutableBytes { rawBuffer in
        guard let baseAddress = rawBuffer.baseAddress else { throw RenderError.contextFailed }
        guard let context = CGContext(
            data: baseAddress,
            width: canvasWidth,
            height: canvasHeight,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: bitmapInfo
        ) else {
            throw RenderError.contextFailed
        }

        context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))
        context.interpolationQuality = .high

        for pageNumber in 1...arguments.expectedPages {
            guard let page = document.page(at: pageNumber) else {
                throw RenderError.pageMissing(pageNumber)
            }
            let mediaBox = page.getBoxRect(.mediaBox)
            guard assertClose(mediaBox.width, CGFloat(arguments.pageWidth)),
                  assertClose(mediaBox.height, CGFloat(arguments.pageHeight)) else {
                throw RenderError.pageSizeMismatch(pageNumber, mediaBox.width, mediaBox.height)
            }
            let destination = CGRect(
                x: 0,
                y: CGFloat(arguments.expectedPages - pageNumber) * CGFloat(targetPageHeight),
                width: CGFloat(targetPageWidth),
                height: CGFloat(targetPageHeight)
            )
            let scaleX = destination.width / mediaBox.width
            let scaleY = destination.height / mediaBox.height
            context.saveGState()
            context.translateBy(x: destination.minX, y: destination.minY)
            context.scaleBy(x: scaleX, y: scaleY)
            context.translateBy(x: -mediaBox.minX, y: -mediaBox.minY)
            context.drawPDFPage(page)
            context.restoreGState()
        }

        guard let image = context.makeImage() else { throw RenderError.imageFailed }
        guard let destination = CGImageDestinationCreateWithURL(outputUrl as CFURL, "public.png" as CFString, 1, nil) else {
            throw RenderError.writeFailed
        }
        CGImageDestinationAddImage(destination, image, nil)
        guard CGImageDestinationFinalize(destination) else {
            throw RenderError.writeFailed
        }
    }

    print("{\"width\":\(canvasWidth),\"height\":\(canvasHeight),\"pages\":\(arguments.expectedPages)}")
}

do {
    try render(parseArguments(Array(CommandLine.arguments.dropFirst())))
} catch {
    fputs("ERROR: \(error)\n", stderr)
    exit(1)
}
