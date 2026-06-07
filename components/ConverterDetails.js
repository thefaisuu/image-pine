import React from 'react';

export default function ConverterDetails() {
  return (
    <div className="bg-white border border-bordercolor rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Bulk Image Converter */}
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </div>
          <h4 className="font-extrabold text-sm text-textmain mb-2">Bulk Image Converter</h4>
          <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-sm">
            Using our batch image converter, you can easily convert multiple image files at once. This is ideal for professionals who need to convert numerous images quickly.
          </p>
        </div>

        {/* Card 2: Convert Images to Multiple Formats */}
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h4 className="font-extrabold text-sm text-textmain mb-2">Convert Images to Multiple Formats</h4>
          <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-sm">
            Whether you need to convert images to JPG, PNG, or other formats, our free image converter supports all common file types. It&apos;s ideal for web, print, or social media.
          </p>
        </div>

        {/* Card 3: Why Our Image Converter Stands Out */}
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="font-extrabold text-sm text-textmain mb-2">
            Why Our Image Converter Stands Out: Fast, Free, and High-Quality Conversions
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-sm">
            Effortless Image Conversion with Our Converter. Flexible Image Convertor for Multiple File Types.
          </p>
        </div>

        {/* Card 4: Free and Secure Online Image Conversions */}
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h4 className="font-extrabold text-sm text-textmain mb-2">Free and Secure Online Image Conversions</h4>
          <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-sm">
            All-in-One Picture Converter for Any Format. Your files are never sent to external servers, protecting your privacy.
          </p>
        </div>

      </div>
    </div>
  );
}
