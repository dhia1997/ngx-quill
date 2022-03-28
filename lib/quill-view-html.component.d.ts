import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { QuillService } from './quill.service';
import { OnChanges, SimpleChanges } from '@angular/core';
import * as ɵngcc0 from '@angular/core';
export declare class QuillViewHTMLComponent implements OnChanges {
    private sanitizer;
    protected service: QuillService;
    content: string;
    theme?: string;
    sanitize: boolean;
    innerHTML: SafeHtml;
    themeClass: string;
    constructor(sanitizer: DomSanitizer, service: QuillService);
    ngOnChanges(changes: SimpleChanges): void;
    static ɵfac: ɵngcc0.ɵɵFactoryDeclaration<QuillViewHTMLComponent, never>;
    static ɵcmp: ɵngcc0.ɵɵComponentDeclaration<QuillViewHTMLComponent, "quill-view-html", never, { "content": "content"; "sanitize": "sanitize"; "theme": "theme"; }, {}, never, never>;
}

//# sourceMappingURL=quill-view-html.component.d.ts.map