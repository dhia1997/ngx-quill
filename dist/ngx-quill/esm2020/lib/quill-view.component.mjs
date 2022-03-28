import { isPlatformServer } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Output, PLATFORM_ID, ViewEncapsulation, SecurityContext } from '@angular/core';
import { getFormat } from './helpers';
import * as i0 from "@angular/core";
import * as i1 from "./quill.service";
import * as i2 from "@angular/platform-browser";
export class QuillViewComponent {
    constructor(elementRef, renderer, zone, service, domSanitizer, platformId) {
        this.elementRef = elementRef;
        this.renderer = renderer;
        this.zone = zone;
        this.service = service;
        this.domSanitizer = domSanitizer;
        this.platformId = platformId;
        this.strict = true;
        this.customModules = [];
        this.customOptions = [];
        this.preserveWhitespace = false;
        this.onEditorCreated = new EventEmitter();
        this.quillSubscription = null;
        this.valueSetter = (quillEditor, value) => {
            const format = getFormat(this.format, this.service.config.format);
            let content = value;
            if (format === 'text') {
                quillEditor.setText(content);
            }
            else {
                if (format === 'html') {
                    const sanitize = [true, false].includes(this.sanitize) ? this.sanitize : (this.service.config.sanitize || false);
                    if (sanitize) {
                        value = this.domSanitizer.sanitize(SecurityContext.HTML, value);
                    }
                    content = quillEditor.clipboard.convert(value);
                }
                else if (format === 'json') {
                    try {
                        content = JSON.parse(value);
                    }
                    catch (e) {
                        content = [{ insert: value }];
                    }
                }
                quillEditor.setContents(content);
            }
        };
    }
    ngOnChanges(changes) {
        if (!this.quillEditor) {
            return;
        }
        if (changes.content) {
            this.valueSetter(this.quillEditor, changes.content.currentValue);
        }
    }
    ngAfterViewInit() {
        if (isPlatformServer(this.platformId)) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.quillSubscription = this.service.getQuill().subscribe(Quill => {
            const modules = Object.assign({}, this.modules || this.service.config.modules);
            modules.toolbar = false;
            this.customOptions.forEach((customOption) => {
                const newCustomOption = Quill.import(customOption.import);
                newCustomOption.whitelist = customOption.whitelist;
                Quill.register(newCustomOption, true);
            });
            this.customModules.forEach(({ implementation, path }) => {
                Quill.register(path, implementation);
            });
            let debug = this.debug;
            if (!debug && debug !== false && this.service.config.debug) {
                debug = this.service.config.debug;
            }
            let formats = this.formats;
            if (!formats && formats === undefined) {
                formats = this.service.config.formats ?
                    Object.assign({}, this.service.config.formats) : (this.service.config.formats === null ? null : undefined);
            }
            const theme = this.theme || (this.service.config.theme ? this.service.config.theme : 'snow');
            this.elementRef.nativeElement.insertAdjacentHTML('afterbegin', this.preserveWhitespace ? '<pre quill-view-element></pre>' : '<div quill-view-element></div>');
            this.editorElem = this.elementRef.nativeElement.querySelector('[quill-view-element]');
            this.zone.runOutsideAngular(() => {
                this.quillEditor = new Quill(this.editorElem, {
                    debug: debug,
                    formats: formats,
                    modules,
                    readOnly: true,
                    strict: this.strict,
                    theme
                });
            });
            this.renderer.addClass(this.editorElem, 'ngx-quill-view');
            if (this.content) {
                this.valueSetter(this.quillEditor, this.content);
            }
            // The `requestAnimationFrame` triggers change detection. There's no sense to invoke the `requestAnimationFrame` if anyone is
            // listening to the `onEditorCreated` event inside the template, for instance `<quill-view (onEditorCreated)="...">`.
            if (!this.onEditorCreated.observers.length) {
                return;
            }
            // The `requestAnimationFrame` will trigger change detection and `onEditorCreated` will also call `markDirty()`
            // internally, since Angular wraps template event listeners into `listener` instruction. We're using the `requestAnimationFrame`
            // to prevent the frame drop and avoid `ExpressionChangedAfterItHasBeenCheckedError` error.
            requestAnimationFrame(() => {
                this.onEditorCreated.emit(this.quillEditor);
            });
        });
    }
    ngOnDestroy() {
        this.quillSubscription?.unsubscribe();
        this.quillSubscription = null;
    }
}
QuillViewComponent.ɵfac = function QuillViewComponent_Factory(t) { return new (t || QuillViewComponent)(i0.ɵɵdirectiveInject(i0.ElementRef), i0.ɵɵdirectiveInject(i0.Renderer2), i0.ɵɵdirectiveInject(i0.NgZone), i0.ɵɵdirectiveInject(i1.QuillService), i0.ɵɵdirectiveInject(i2.DomSanitizer), i0.ɵɵdirectiveInject(PLATFORM_ID)); };
QuillViewComponent.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: QuillViewComponent, selectors: [["quill-view"]], inputs: { format: "format", theme: "theme", modules: "modules", debug: "debug", formats: "formats", sanitize: "sanitize", strict: "strict", content: "content", customModules: "customModules", customOptions: "customOptions", preserveWhitespace: "preserveWhitespace" }, outputs: { onEditorCreated: "onEditorCreated" }, features: [i0.ɵɵNgOnChangesFeature], decls: 0, vars: 0, template: function QuillViewComponent_Template(rf, ctx) { }, styles: [".ql-container.ngx-quill-view{border:0}\n"], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuillViewComponent, [{
        type: Component,
        args: [{
                encapsulation: ViewEncapsulation.None,
                selector: 'quill-view',
                styles: [`
.ql-container.ngx-quill-view {
  border: 0;
}
`],
                template: `
`
            }]
    }], function () { return [{ type: i0.ElementRef }, { type: i0.Renderer2 }, { type: i0.NgZone }, { type: i1.QuillService }, { type: i2.DomSanitizer }, { type: undefined, decorators: [{
                type: Inject,
                args: [PLATFORM_ID]
            }] }]; }, { format: [{
            type: Input
        }], theme: [{
            type: Input
        }], modules: [{
            type: Input
        }], debug: [{
            type: Input
        }], formats: [{
            type: Input
        }], sanitize: [{
            type: Input
        }], strict: [{
            type: Input
        }], content: [{
            type: Input
        }], customModules: [{
            type: Input
        }], customOptions: [{
            type: Input
        }], preserveWhitespace: [{
            type: Input
        }], onEditorCreated: [{
            type: Output
        }] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpbGwtdmlldy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtcXVpbGwvc3JjL2xpYi9xdWlsbC12aWV3LmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUlsRCxPQUFPLEVBRUwsU0FBUyxFQUVULFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUNMLE1BQU0sRUFFTixXQUFXLEVBR1gsaUJBQWlCLEVBRWpCLGVBQWUsRUFFaEIsTUFBTSxlQUFlLENBQUE7QUFJdEIsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQTs7OztBQWVuQyxNQUFNLE9BQU8sa0JBQWtCO0lBb0I3QixZQUNTLFVBQXNCLEVBQ25CLFFBQW1CLEVBQ25CLElBQVksRUFDWixPQUFxQixFQUNyQixZQUEwQixFQUNMLFVBQWU7UUFMdkMsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUNuQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ25CLFNBQUksR0FBSixJQUFJLENBQVE7UUFDWixZQUFPLEdBQVAsT0FBTyxDQUFjO1FBQ3JCLGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBQ0wsZUFBVSxHQUFWLFVBQVUsQ0FBSztRQW5CdkMsV0FBTSxHQUFHLElBQUksQ0FBQTtRQUViLGtCQUFhLEdBQW1CLEVBQUUsQ0FBQTtRQUNsQyxrQkFBYSxHQUFtQixFQUFFLENBQUE7UUFDbEMsdUJBQWtCLEdBQUcsS0FBSyxDQUFBO1FBRXpCLG9CQUFlLEdBQXNCLElBQUksWUFBWSxFQUFFLENBQUE7UUFLekQsc0JBQWlCLEdBQXdCLElBQUksQ0FBQTtRQVdyRCxnQkFBVyxHQUFHLENBQUMsV0FBc0IsRUFBRSxLQUFVLEVBQU8sRUFBRTtZQUN4RCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNqRSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUE7WUFDbkIsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO2dCQUNyQixXQUFXLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO2FBQzdCO2lCQUFNO2dCQUNMLElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtvQkFDckIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLENBQUE7b0JBQ2hILElBQUksUUFBUSxFQUFFO3dCQUNaLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO3FCQUNoRTtvQkFDRCxPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7aUJBQy9DO3FCQUFNLElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtvQkFDNUIsSUFBSTt3QkFDRixPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtxQkFDNUI7b0JBQUMsT0FBTyxDQUFDLEVBQUU7d0JBQ1YsT0FBTyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtxQkFDOUI7aUJBQ0Y7Z0JBQ0QsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTthQUNqQztRQUNILENBQUMsQ0FBQTtJQXZCRSxDQUFDO0lBeUJKLFdBQVcsQ0FBQyxPQUFzQjtRQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNyQixPQUFNO1NBQ1A7UUFDRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7U0FDakU7SUFDSCxDQUFDO0lBRUQsZUFBZTtRQUNiLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3JDLE9BQU07U0FDUDtRQUVELGdFQUFnRTtRQUNoRSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDakUsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUM5RSxPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQTtZQUV2QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUFFO2dCQUMxQyxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDekQsZUFBZSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFBO2dCQUNsRCxLQUFLLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUN2QyxDQUFDLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxjQUFjLEVBQUUsSUFBSSxFQUFDLEVBQUUsRUFBRTtnQkFDcEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUE7WUFDdEMsQ0FBQyxDQUFDLENBQUE7WUFFRixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO1lBQ3RCLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7Z0JBQzFELEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUE7YUFDbEM7WUFFRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFBO1lBQzFCLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtnQkFDckMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNyQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFBO2FBQzdHO1lBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUU1RixJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FDOUMsWUFBWSxFQUNaLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLGdDQUFnQyxDQUM5RixDQUFBO1lBRUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQzNELHNCQUFzQixDQUNSLENBQUE7WUFFaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtvQkFDNUMsS0FBSyxFQUFFLEtBQVk7b0JBQ25CLE9BQU8sRUFBRSxPQUFjO29CQUN2QixPQUFPO29CQUNQLFFBQVEsRUFBRSxJQUFJO29CQUNkLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtvQkFDbkIsS0FBSztpQkFDTixDQUFDLENBQUE7WUFDSixDQUFDLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTtZQUV6RCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7YUFDakQ7WUFFRCw2SEFBNkg7WUFDN0gscUhBQXFIO1lBQ3JILElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzFDLE9BQU07YUFDUDtZQUVELCtHQUErRztZQUMvRyxnSUFBZ0k7WUFDaEksMkZBQTJGO1lBQzNGLHFCQUFxQixDQUFDLEdBQUcsRUFBRTtnQkFDekIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQzdDLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsQ0FBQTtRQUNyQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFBO0lBQy9CLENBQUM7O29GQXpJVSxrQkFBa0IsK01BMEJuQixXQUFXO3FFQTFCVixrQkFBa0I7dUZBQWxCLGtCQUFrQjtjQVg5QixTQUFTO2VBQUM7Z0JBQ1QsYUFBYSxFQUFFLGlCQUFpQixDQUFDLElBQUk7Z0JBQ3JDLFFBQVEsRUFBRSxZQUFZO2dCQUN0QixNQUFNLEVBQUUsQ0FBQzs7OztDQUlWLENBQUM7Z0JBQ0EsUUFBUSxFQUFFO0NBQ1g7YUFDQTs7c0JBMkJJLE1BQU07dUJBQUMsV0FBVzt3QkF6QlosTUFBTTtrQkFBZCxLQUFLO1lBQ0csS0FBSztrQkFBYixLQUFLO1lBQ0csT0FBTztrQkFBZixLQUFLO1lBQ0csS0FBSztrQkFBYixLQUFLO1lBQ0csT0FBTztrQkFBZixLQUFLO1lBQ0csUUFBUTtrQkFBaEIsS0FBSztZQUNHLE1BQU07a0JBQWQsS0FBSztZQUNHLE9BQU87a0JBQWYsS0FBSztZQUNHLGFBQWE7a0JBQXJCLEtBQUs7WUFDRyxhQUFhO2tCQUFyQixLQUFLO1lBQ0csa0JBQWtCO2tCQUExQixLQUFLO1lBRUksZUFBZTtrQkFBeEIsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzUGxhdGZvcm1TZXJ2ZXIgfSBmcm9tICdAYW5ndWxhci9jb21tb24nXG5pbXBvcnQgUXVpbGxUeXBlIGZyb20gJ3F1aWxsJ1xuaW1wb3J0IHsgUXVpbGxNb2R1bGVzIH0gZnJvbSAnLi9xdWlsbC1lZGl0b3IuaW50ZXJmYWNlcydcblxuaW1wb3J0IHtcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE91dHB1dCxcbiAgT25DaGFuZ2VzLFxuICBQTEFURk9STV9JRCxcbiAgUmVuZGVyZXIyLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgTmdab25lLFxuICBTZWN1cml0eUNvbnRleHQsXG4gIE9uRGVzdHJveVxufSBmcm9tICdAYW5ndWxhci9jb3JlJ1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcydcblxuaW1wb3J0IHsgQ3VzdG9tT3B0aW9uLCBDdXN0b21Nb2R1bGUgfSBmcm9tICcuL3F1aWxsLWVkaXRvci5pbnRlcmZhY2VzJ1xuaW1wb3J0IHtnZXRGb3JtYXR9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCB7IFF1aWxsU2VydmljZSB9IGZyb20gJy4vcXVpbGwuc2VydmljZSdcbmltcG9ydCB7IERvbVNhbml0aXplciB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInXG5cbkBDb21wb25lbnQoe1xuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBzZWxlY3RvcjogJ3F1aWxsLXZpZXcnLFxuICBzdHlsZXM6IFtgXG4ucWwtY29udGFpbmVyLm5neC1xdWlsbC12aWV3IHtcbiAgYm9yZGVyOiAwO1xufVxuYF0sXG4gIHRlbXBsYXRlOiBgXG5gXG59KVxuZXhwb3J0IGNsYXNzIFF1aWxsVmlld0NvbXBvbmVudCBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95IHtcbiAgQElucHV0KCkgZm9ybWF0PzogJ29iamVjdCcgfCAnaHRtbCcgfCAndGV4dCcgfCAnanNvbidcbiAgQElucHV0KCkgdGhlbWU/OiBzdHJpbmdcbiAgQElucHV0KCkgbW9kdWxlcz86IFF1aWxsTW9kdWxlc1xuICBASW5wdXQoKSBkZWJ1Zz86ICd3YXJuJyB8ICdsb2cnIHwgJ2Vycm9yJyB8IGZhbHNlXG4gIEBJbnB1dCgpIGZvcm1hdHM/OiBzdHJpbmdbXSB8IG51bGxcbiAgQElucHV0KCkgc2FuaXRpemU/OiBib29sZWFuXG4gIEBJbnB1dCgpIHN0cmljdCA9IHRydWVcbiAgQElucHV0KCkgY29udGVudDogYW55XG4gIEBJbnB1dCgpIGN1c3RvbU1vZHVsZXM6IEN1c3RvbU1vZHVsZVtdID0gW11cbiAgQElucHV0KCkgY3VzdG9tT3B0aW9uczogQ3VzdG9tT3B0aW9uW10gPSBbXVxuICBASW5wdXQoKSBwcmVzZXJ2ZVdoaXRlc3BhY2UgPSBmYWxzZVxuXG4gIEBPdXRwdXQoKSBvbkVkaXRvckNyZWF0ZWQ6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgcXVpbGxFZGl0b3IhOiBRdWlsbFR5cGVcbiAgZWRpdG9yRWxlbSE6IEhUTUxFbGVtZW50XG5cbiAgcHJpdmF0ZSBxdWlsbFN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbCA9IG51bGxcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBwcm90ZWN0ZWQgcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICBwcm90ZWN0ZWQgem9uZTogTmdab25lLFxuICAgIHByb3RlY3RlZCBzZXJ2aWNlOiBRdWlsbFNlcnZpY2UsXG4gICAgcHJvdGVjdGVkIGRvbVNhbml0aXplcjogRG9tU2FuaXRpemVyLFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHByb3RlY3RlZCBwbGF0Zm9ybUlkOiBhbnksXG4gICkge31cblxuICB2YWx1ZVNldHRlciA9IChxdWlsbEVkaXRvcjogUXVpbGxUeXBlLCB2YWx1ZTogYW55KTogYW55ID0+IHtcbiAgICBjb25zdCBmb3JtYXQgPSBnZXRGb3JtYXQodGhpcy5mb3JtYXQsIHRoaXMuc2VydmljZS5jb25maWcuZm9ybWF0KVxuICAgIGxldCBjb250ZW50ID0gdmFsdWVcbiAgICBpZiAoZm9ybWF0ID09PSAndGV4dCcpIHtcbiAgICAgIHF1aWxsRWRpdG9yLnNldFRleHQoY29udGVudClcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGZvcm1hdCA9PT0gJ2h0bWwnKSB7XG4gICAgICAgIGNvbnN0IHNhbml0aXplID0gW3RydWUsIGZhbHNlXS5pbmNsdWRlcyh0aGlzLnNhbml0aXplKSA/IHRoaXMuc2FuaXRpemUgOiAodGhpcy5zZXJ2aWNlLmNvbmZpZy5zYW5pdGl6ZSB8fCBmYWxzZSlcbiAgICAgICAgaWYgKHNhbml0aXplKSB7XG4gICAgICAgICAgdmFsdWUgPSB0aGlzLmRvbVNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuSFRNTCwgdmFsdWUpXG4gICAgICAgIH1cbiAgICAgICAgY29udGVudCA9IHF1aWxsRWRpdG9yLmNsaXBib2FyZC5jb252ZXJ0KHZhbHVlKVxuICAgICAgfSBlbHNlIGlmIChmb3JtYXQgPT09ICdqc29uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnRlbnQgPSBKU09OLnBhcnNlKHZhbHVlKVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29udGVudCA9IFt7IGluc2VydDogdmFsdWUgfV1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcXVpbGxFZGl0b3Iuc2V0Q29udGVudHMoY29udGVudClcbiAgICB9XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgaWYgKCF0aGlzLnF1aWxsRWRpdG9yKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKGNoYW5nZXMuY29udGVudCkge1xuICAgICAgdGhpcy52YWx1ZVNldHRlcih0aGlzLnF1aWxsRWRpdG9yLCBjaGFuZ2VzLmNvbnRlbnQuY3VycmVudFZhbHVlKVxuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAoaXNQbGF0Zm9ybVNlcnZlcih0aGlzLnBsYXRmb3JtSWQpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uXG4gICAgdGhpcy5xdWlsbFN1YnNjcmlwdGlvbiA9IHRoaXMuc2VydmljZS5nZXRRdWlsbCgpLnN1YnNjcmliZShRdWlsbCA9PiB7XG4gICAgICBjb25zdCBtb2R1bGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5tb2R1bGVzIHx8IHRoaXMuc2VydmljZS5jb25maWcubW9kdWxlcylcbiAgICAgIG1vZHVsZXMudG9vbGJhciA9IGZhbHNlXG5cbiAgICAgIHRoaXMuY3VzdG9tT3B0aW9ucy5mb3JFYWNoKChjdXN0b21PcHRpb24pID0+IHtcbiAgICAgICAgY29uc3QgbmV3Q3VzdG9tT3B0aW9uID0gUXVpbGwuaW1wb3J0KGN1c3RvbU9wdGlvbi5pbXBvcnQpXG4gICAgICAgIG5ld0N1c3RvbU9wdGlvbi53aGl0ZWxpc3QgPSBjdXN0b21PcHRpb24ud2hpdGVsaXN0XG4gICAgICAgIFF1aWxsLnJlZ2lzdGVyKG5ld0N1c3RvbU9wdGlvbiwgdHJ1ZSlcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMuY3VzdG9tTW9kdWxlcy5mb3JFYWNoKCh7aW1wbGVtZW50YXRpb24sIHBhdGh9KSA9PiB7XG4gICAgICAgIFF1aWxsLnJlZ2lzdGVyKHBhdGgsIGltcGxlbWVudGF0aW9uKVxuICAgICAgfSlcblxuICAgICAgbGV0IGRlYnVnID0gdGhpcy5kZWJ1Z1xuICAgICAgaWYgKCFkZWJ1ZyAmJiBkZWJ1ZyAhPT0gZmFsc2UgJiYgdGhpcy5zZXJ2aWNlLmNvbmZpZy5kZWJ1Zykge1xuICAgICAgICBkZWJ1ZyA9IHRoaXMuc2VydmljZS5jb25maWcuZGVidWdcbiAgICAgIH1cblxuICAgICAgbGV0IGZvcm1hdHMgPSB0aGlzLmZvcm1hdHNcbiAgICAgIGlmICghZm9ybWF0cyAmJiBmb3JtYXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9ybWF0cyA9IHRoaXMuc2VydmljZS5jb25maWcuZm9ybWF0cyA/XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zZXJ2aWNlLmNvbmZpZy5mb3JtYXRzKSA6ICh0aGlzLnNlcnZpY2UuY29uZmlnLmZvcm1hdHMgPT09IG51bGwgPyBudWxsIDogdW5kZWZpbmVkKVxuICAgICAgfVxuICAgICAgY29uc3QgdGhlbWUgPSB0aGlzLnRoZW1lIHx8ICh0aGlzLnNlcnZpY2UuY29uZmlnLnRoZW1lID8gdGhpcy5zZXJ2aWNlLmNvbmZpZy50aGVtZSA6ICdzbm93JylcblxuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuaW5zZXJ0QWRqYWNlbnRIVE1MKFxuICAgICAgICAnYWZ0ZXJiZWdpbicsXG4gICAgICAgIHRoaXMucHJlc2VydmVXaGl0ZXNwYWNlID8gJzxwcmUgcXVpbGwtdmlldy1lbGVtZW50PjwvcHJlPicgOiAnPGRpdiBxdWlsbC12aWV3LWVsZW1lbnQ+PC9kaXY+J1xuICAgICAgKVxuXG4gICAgICB0aGlzLmVkaXRvckVsZW0gPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAnW3F1aWxsLXZpZXctZWxlbWVudF0nXG4gICAgICApIGFzIEhUTUxFbGVtZW50XG5cbiAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHRoaXMucXVpbGxFZGl0b3IgPSBuZXcgUXVpbGwodGhpcy5lZGl0b3JFbGVtLCB7XG4gICAgICAgICAgZGVidWc6IGRlYnVnIGFzIGFueSxcbiAgICAgICAgICBmb3JtYXRzOiBmb3JtYXRzIGFzIGFueSxcbiAgICAgICAgICBtb2R1bGVzLFxuICAgICAgICAgIHJlYWRPbmx5OiB0cnVlLFxuICAgICAgICAgIHN0cmljdDogdGhpcy5zdHJpY3QsXG4gICAgICAgICAgdGhlbWVcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5lZGl0b3JFbGVtLCAnbmd4LXF1aWxsLXZpZXcnKVxuXG4gICAgICBpZiAodGhpcy5jb250ZW50KSB7XG4gICAgICAgIHRoaXMudmFsdWVTZXR0ZXIodGhpcy5xdWlsbEVkaXRvciwgdGhpcy5jb250ZW50KVxuICAgICAgfVxuXG4gICAgICAvLyBUaGUgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgdHJpZ2dlcnMgY2hhbmdlIGRldGVjdGlvbi4gVGhlcmUncyBubyBzZW5zZSB0byBpbnZva2UgdGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGlmIGFueW9uZSBpc1xuICAgICAgLy8gbGlzdGVuaW5nIHRvIHRoZSBgb25FZGl0b3JDcmVhdGVkYCBldmVudCBpbnNpZGUgdGhlIHRlbXBsYXRlLCBmb3IgaW5zdGFuY2UgYDxxdWlsbC12aWV3IChvbkVkaXRvckNyZWF0ZWQpPVwiLi4uXCI+YC5cbiAgICAgIGlmICghdGhpcy5vbkVkaXRvckNyZWF0ZWQub2JzZXJ2ZXJzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHdpbGwgdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBgb25FZGl0b3JDcmVhdGVkYCB3aWxsIGFsc28gY2FsbCBgbWFya0RpcnR5KClgXG4gICAgICAvLyBpbnRlcm5hbGx5LCBzaW5jZSBBbmd1bGFyIHdyYXBzIHRlbXBsYXRlIGV2ZW50IGxpc3RlbmVycyBpbnRvIGBsaXN0ZW5lcmAgaW5zdHJ1Y3Rpb24uIFdlJ3JlIHVzaW5nIHRoZSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYFxuICAgICAgLy8gdG8gcHJldmVudCB0aGUgZnJhbWUgZHJvcCBhbmQgYXZvaWQgYEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJJdEhhc0JlZW5DaGVja2VkRXJyb3JgIGVycm9yLlxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgdGhpcy5vbkVkaXRvckNyZWF0ZWQuZW1pdCh0aGlzLnF1aWxsRWRpdG9yKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5xdWlsbFN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKVxuICAgIHRoaXMucXVpbGxTdWJzY3JpcHRpb24gPSBudWxsXG4gIH1cbn1cbiJdfQ==