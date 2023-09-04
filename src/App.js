import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + '/pdf.worker.js';

function App() {
    const [pdfDoc, setPdfDoc] = useState(null);
    const [searchTerm, setSearchTerm] = useState('Chapter I');
    const [results, setResults] = useState([]);
    const [pageContents, setPageContents] = useState({});
const [startPage, setStartPage] = useState('');
const [endPage, setEndPage] = useState('');
const exportPDF = async () => {
    if (pdfDoc && startPage && endPage) {
        // Convert startPage and endPage to numbers
        const start = parseInt(startPage, 10);
        const end = parseInt(endPage, 10);

        // Validate the page numbers
        if (start > 0 && end > 0 && end >= start && start <= pdfDoc.numPages && end <= pdfDoc.numPages) {
            try {
                // Create a new PDFDocument instance
                const newPdfDoc = await PDFDocument.create();
                
                // Load the original PDF document
                const originalPdfBytes = await pdfDoc.getData();
                const originalPdfDoc = await PDFDocument.load(originalPdfBytes);
                
                // Copy pages from the original PDF to the new PDF
                for (let i = start; i <= end; i++) {
                    const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [i - 1]);
                    newPdfDoc.addPage(copiedPage);
                }
                
                // Serialize the new PDF to bytes
                const newPdfBytes = await newPdfDoc.save();
                
                // Create a Blob object and a link element to allow the user to download the new PDF
                const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'exported.pdf';
                link.click();
            } catch (error) {
                console.error("Error exporting PDF:", error);
            }
        } else {
            console.error("Invalid page numbers");
        }
    }
};


    const onFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const typedArray = new Uint8Array(event.target.result);
                try {
                    const pdfDocument = await pdfjs.getDocument({ data: typedArray }).promise;
                    setPdfDoc(pdfDocument);
                    // searchPDF(pdfDocument, searchTerm);
                } catch (error) {
                    console.error("Error parsing the PDF:", error);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

const searchPDF = async (pdfDocument, term, singleInstance = false) => {
    let newResults = [];
    let newPageContents = {};

    for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const content = await page.getTextContent();
        const textItems = content.items.map(item => item.str).join(' ');
        const lowerCaseTextItems = textItems.toLowerCase();

        if (lowerCaseTextItems.includes(term.toLowerCase())) {
    const firstTenWords = textItems.split(' ').slice(0, 10).join(' ');
    newResults.push({ page: i, preview: firstTenWords, fullText: textItems });
    newPageContents[i] = false;

    if (singleInstance) {
        break;
    }
}

    }

    setResults(newResults);
    setPageContents(newPageContents);

    if (newResults.length === 0) {
        console.log(`"${term}" not found in the document.`);
    }
};


 return (
    <div>
        <div>
            
    <div> <br /> <br />
        <input type="file" onChange={onFileChange} />
        <br /> <br />
        <input type="text" value={startPage} onChange={e => setStartPage(e.target.value)} placeholder="Start Page" />
<input type="text" value={endPage} onChange={e => setEndPage(e.target.value)} placeholder="End Page" />
<button onClick={exportPDF}>Export PDF</button><br/><br/>

        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search term" />
        <button onClick={() => searchPDF(pdfDoc, searchTerm)}>Search</button> <br /> <br />
        <button onClick={() => searchPDF(pdfDoc, "contents", true)}>List Table of Contents</button>
            <div>
                {results.map((result, index) => (
                    <div key={index}>
                        <p>Page {result.page}: {result.preview}</p>
<button onClick={() => setPageContents({ ...pageContents, [result.page]: !pageContents[result.page] })}>Print Entire Page</button>
{pageContents[result.page] && <p>{result.fullText}</p>}
                    </div>
                ))}
            </div>
            <div>
     
            </div>
    </div>
    

        </div>
    </div>
);
}

export default App;


