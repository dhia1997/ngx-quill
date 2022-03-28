import { Injector } from '@angular/core';
import { QuillConfig } from './quill-editor.interfaces';
import * as ɵngcc0 from '@angular/core';
export declare class QuillService {
    config: QuillConfig;
    private Quill;
    private $importPromise;
    private count;
    private document;
    constructor(injector: Injector, config: QuillConfig);
    getQuill(): Promise<any>;
    static ɵfac: ɵngcc0.ɵɵFactoryDeclaration<QuillService, [null, { optional: true; }]>;
}

//# sourceMappingURL=quill.service.d.ts.map