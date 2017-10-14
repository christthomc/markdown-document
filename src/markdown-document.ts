import * as winston from "winston";

import { default as optionsService, IOptions } from "./services/options-service";
import markdownService from "./services/markdown-service";
import layoutService from "./services/layout-service";
import { default as fileService, TempPath } from "./services/file-service";
import pdfService from "./services/pdf-service";
import { default as metadataService, IPdfMetadata } from "./services/metadata-service";

export class MarkdownDocument {
    constructor(private options: IOptions) {
    }

    public async createPdfAsync() {
        let timer = winston.startTimer();
        await optionsService.consolidateAsync(this.options);
        timer.done('Loading options finished');
        
        timer = winston.startTimer();
        const markdownAsHtml = await markdownService.renderFileAsync(this.options.documentPath);
        timer.done('Render markdown to html finished');

        timer = winston.startTimer();
        const tempPath = await layoutService.applyLayoutAsync(this.options.layout, markdownAsHtml, this.options, { });
        timer.done('Applying layout finished');

        timer = winston.startTimer();
        await pdfService.renderPdfAsync(tempPath.path, this.options.outputPath, this.options.pdf);
        timer.done('Rendering pdf finished');

        if (this.options.writeMetadata) {
            timer = winston.startTimer();
            await metadataService.setMetadataAsync<IPdfMetadata>(this.options.outputPath, {
                Title: this.options.document.title,
                Subject: this.options.document.subject,
                Author: this.options.document.authors.join(';'),
                Keywords: this.options.document.keywords || []
            });
            timer.done('Setting pdf finished');
        }

        await tempPath.deleteAsync();
    }
}

export { IOptions, IDocumentInformation } from "./services/options-service";