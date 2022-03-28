import { DOCUMENT, isPlatformServer } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectorRef, Component, Directive, ElementRef, EventEmitter, forwardRef, Inject, Input, NgZone, Output, PLATFORM_ID, Renderer2, SecurityContext, ViewEncapsulation } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { defaultModules } from './quill-defaults';
import { getFormat } from './helpers';
import { QuillService } from './quill.service';
import * as i0 from "@angular/core";
import * as i1 from "@angular/platform-browser";
import * as i2 from "./quill.service";
const _c0 = [[["", "quill-editor-toolbar", ""]]];
const _c1 = ["[quill-editor-toolbar]"];
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class QuillEditorBase {
    constructor(injector, elementRef, cd, domSanitizer, platformId, renderer, zone, service) {
        this.elementRef = elementRef;
        this.cd = cd;
        this.domSanitizer = domSanitizer;
        this.platformId = platformId;
        this.renderer = renderer;
        this.zone = zone;
        this.service = service;
        this.required = false;
        this.customToolbarPosition = 'top';
        this.styles = null;
        this.strict = true;
        this.customOptions = [];
        this.customModules = [];
        this.preserveWhitespace = false;
        this.trimOnValidation = false;
        this.compareValues = false;
        this.filterNull = false;
        /*
        https://github.com/KillerCodeMonkey/ngx-quill/issues/1257 - fix null value set
      
        provide default empty value
        by default null
      
        e.g. defaultEmptyValue="" - empty string
      
        <quill-editor
          defaultEmptyValue=""
          formControlName="message"
        ></quill-editor>
        */
        this.defaultEmptyValue = null;
        this.onEditorCreated = new EventEmitter();
        this.onEditorChanged = new EventEmitter();
        this.onContentChanged = new EventEmitter();
        this.onSelectionChanged = new EventEmitter();
        this.onFocus = new EventEmitter();
        this.onBlur = new EventEmitter();
        this.disabled = false; // used to store initial value before ViewInit
        this.subscription = null;
        this.quillSubscription = null;
        this.valueGetter = (quillEditor, editorElement) => {
            let html = editorElement.querySelector('.ql-editor').innerHTML;
            if (html === '<p><br></p>' || html === '<div><br></div>') {
                html = this.defaultEmptyValue;
            }
            let modelValue = html;
            const format = getFormat(this.format, this.service.config.format);
            if (format === 'text') {
                modelValue = quillEditor.getText();
            }
            else if (format === 'object') {
                modelValue = quillEditor.getContents();
            }
            else if (format === 'json') {
                try {
                    modelValue = JSON.stringify(quillEditor.getContents());
                }
                catch (e) {
                    modelValue = quillEditor.getText();
                }
            }
            return modelValue;
        };
        this.valueSetter = (quillEditor, value) => {
            const format = getFormat(this.format, this.service.config.format);
            if (format === 'html') {
                const sanitize = [true, false].includes(this.sanitize) ? this.sanitize : (this.service.config.sanitize || false);
                if (sanitize) {
                    value = this.domSanitizer.sanitize(SecurityContext.HTML, value);
                }
                return quillEditor.clipboard.convert(value);
            }
            else if (format === 'json') {
                try {
                    return JSON.parse(value);
                }
                catch (e) {
                    return [{ insert: value }];
                }
            }
            return value;
        };
        this.selectionChangeHandler = (range, oldRange, source) => {
            const shouldTriggerOnModelTouched = !range && !!this.onModelTouched;
            // only emit changes when there's any listener
            if (!this.onBlur.observers.length &&
                !this.onFocus.observers.length &&
                !this.onSelectionChanged.observers.length &&
                !shouldTriggerOnModelTouched) {
                return;
            }
            this.zone.run(() => {
                if (range === null) {
                    this.onBlur.emit({
                        editor: this.quillEditor,
                        source
                    });
                }
                else if (oldRange === null) {
                    this.onFocus.emit({
                        editor: this.quillEditor,
                        source
                    });
                }
                this.onSelectionChanged.emit({
                    editor: this.quillEditor,
                    oldRange,
                    range,
                    source
                });
                if (shouldTriggerOnModelTouched) {
                    this.onModelTouched();
                }
                this.cd.markForCheck();
            });
        };
        this.textChangeHandler = (delta, oldDelta, source) => {
            // only emit changes emitted by user interactions
            const text = this.quillEditor.getText();
            const content = this.quillEditor.getContents();
            let html = this.editorElem.querySelector('.ql-editor').innerHTML;
            if (html === '<p><br></p>' || html === '<div><br></div>') {
                html = this.defaultEmptyValue;
            }
            const trackChanges = this.trackChanges || this.service.config.trackChanges;
            const shouldTriggerOnModelChange = (source === 'user' || trackChanges && trackChanges === 'all') && !!this.onModelChange;
            // only emit changes when there's any listener
            if (!this.onContentChanged.observers.length && !shouldTriggerOnModelChange) {
                return;
            }
            this.zone.run(() => {
                if (shouldTriggerOnModelChange) {
                    this.onModelChange(this.valueGetter(this.quillEditor, this.editorElem));
                }
                this.onContentChanged.emit({
                    content,
                    delta,
                    editor: this.quillEditor,
                    html,
                    oldDelta,
                    source,
                    text
                });
                this.cd.markForCheck();
            });
        };
        // eslint-disable-next-line max-len
        this.editorChangeHandler = (event, current, old, source) => {
            // only emit changes when there's any listener
            if (!this.onEditorChanged.observers.length) {
                return;
            }
            // only emit changes emitted by user interactions
            if (event === 'text-change') {
                const text = this.quillEditor.getText();
                const content = this.quillEditor.getContents();
                let html = this.editorElem.querySelector('.ql-editor').innerHTML;
                if (html === '<p><br></p>' || html === '<div><br></div>') {
                    html = this.defaultEmptyValue;
                }
                this.zone.run(() => {
                    this.onEditorChanged.emit({
                        content,
                        delta: current,
                        editor: this.quillEditor,
                        event,
                        html,
                        oldDelta: old,
                        source,
                        text
                    });
                    this.cd.markForCheck();
                });
            }
            else {
                this.zone.run(() => {
                    this.onEditorChanged.emit({
                        editor: this.quillEditor,
                        event,
                        oldRange: old,
                        range: current,
                        source
                    });
                    this.cd.markForCheck();
                });
            }
        };
        this.document = injector.get(DOCUMENT);
    }
    static normalizeClassNames(classes) {
        const classList = classes.trim().split(' ');
        return classList.reduce((prev, cur) => {
            const trimmed = cur.trim();
            if (trimmed) {
                prev.push(trimmed);
            }
            return prev;
        }, []);
    }
    ngAfterViewInit() {
        if (isPlatformServer(this.platformId)) {
            return;
        }
        // The `quill-editor` component might be destroyed before the `quill` chunk is loaded and its code is executed
        // this will lead to runtime exceptions, since the code will be executed on DOM nodes that don't exist within the tree.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.quillSubscription = this.service.getQuill().subscribe(Quill => {
            this.elementRef.nativeElement.insertAdjacentHTML(this.customToolbarPosition === 'top' ? 'beforeend' : 'afterbegin', this.preserveWhitespace ? '<pre quill-editor-element></pre>' : '<div quill-editor-element></div>');
            this.editorElem = this.elementRef.nativeElement.querySelector('[quill-editor-element]');
            const toolbarElem = this.elementRef.nativeElement.querySelector('[quill-editor-toolbar]');
            const modules = Object.assign({}, this.modules || this.service.config.modules);
            if (toolbarElem) {
                modules.toolbar = toolbarElem;
            }
            else if (modules.toolbar === undefined) {
                modules.toolbar = defaultModules.toolbar;
            }
            let placeholder = this.placeholder !== undefined ? this.placeholder : this.service.config.placeholder;
            if (placeholder === undefined) {
                placeholder = 'Insert text here ...';
            }
            if (this.styles) {
                Object.keys(this.styles).forEach((key) => {
                    this.renderer.setStyle(this.editorElem, key, this.styles[key]);
                });
            }
            if (this.classes) {
                this.addClasses(this.classes);
            }
            this.customOptions.forEach((customOption) => {
                const newCustomOption = Quill.import(customOption.import);
                newCustomOption.whitelist = customOption.whitelist;
                Quill.register(newCustomOption, true);
            });
            this.customModules.forEach(({ implementation, path }) => {
                Quill.register(path, implementation);
            });
            let bounds = this.bounds && this.bounds === 'self' ? this.editorElem : this.bounds;
            if (!bounds) {
                bounds = this.service.config.bounds ? this.service.config.bounds : this.document.body;
            }
            let debug = this.debug;
            if (!debug && debug !== false && this.service.config.debug) {
                debug = this.service.config.debug;
            }
            let readOnly = this.readOnly;
            if (!readOnly && this.readOnly !== false) {
                readOnly = this.service.config.readOnly !== undefined ? this.service.config.readOnly : false;
            }
            let defaultEmptyValue = this.defaultEmptyValue;
            if (this.service.config.hasOwnProperty('defaultEmptyValue')) {
                defaultEmptyValue = this.service.config.defaultEmptyValue;
            }
            let scrollingContainer = this.scrollingContainer;
            if (!scrollingContainer && this.scrollingContainer !== null) {
                scrollingContainer =
                    this.service.config.scrollingContainer === null
                        || this.service.config.scrollingContainer ? this.service.config.scrollingContainer : null;
            }
            let formats = this.formats;
            if (!formats && formats === undefined) {
                formats = this.service.config.formats ? [...this.service.config.formats] : (this.service.config.formats === null ? null : undefined);
            }
            this.zone.runOutsideAngular(() => {
                this.quillEditor = new Quill(this.editorElem, {
                    bounds,
                    debug: debug,
                    formats: formats,
                    modules,
                    placeholder,
                    readOnly,
                    defaultEmptyValue,
                    scrollingContainer: scrollingContainer,
                    strict: this.strict,
                    theme: this.theme || (this.service.config.theme ? this.service.config.theme : 'snow')
                });
                // Set optional link placeholder, Quill has no native API for it so using workaround
                if (this.linkPlaceholder) {
                    const tooltip = this.quillEditor?.theme?.tooltip;
                    const input = tooltip?.root?.querySelector('input[data-link]');
                    if (input?.dataset) {
                        input.dataset.link = this.linkPlaceholder;
                    }
                }
            });
            if (this.content) {
                const format = getFormat(this.format, this.service.config.format);
                if (format === 'text') {
                    this.quillEditor.setText(this.content, 'silent');
                }
                else {
                    const newValue = this.valueSetter(this.quillEditor, this.content);
                    this.quillEditor.setContents(newValue, 'silent');
                }
                this.quillEditor.getModule('history').clear();
            }
            // initialize disabled status based on this.disabled as default value
            this.setDisabledState();
            this.addQuillEventListeners();
            // The `requestAnimationFrame` triggers change detection. There's no sense to invoke the `requestAnimationFrame` if anyone is
            // listening to the `onEditorCreated` event inside the template, for instance `<quill-view (onEditorCreated)="...">`.
            if (!this.onEditorCreated.observers.length && !this.onValidatorChanged) {
                return;
            }
            // The `requestAnimationFrame` will trigger change detection and `onEditorCreated` will also call `markDirty()`
            // internally, since Angular wraps template event listeners into `listener` instruction. We're using the `requestAnimationFrame`
            // to prevent the frame drop and avoid `ExpressionChangedAfterItHasBeenCheckedError` error.
            requestAnimationFrame(() => {
                if (this.onValidatorChanged) {
                    this.onValidatorChanged();
                }
                this.onEditorCreated.emit(this.quillEditor);
            });
        });
    }
    ngOnDestroy() {
        this.dispose();
        this.quillSubscription?.unsubscribe();
        this.quillSubscription = null;
    }
    ngOnChanges(changes) {
        if (!this.quillEditor) {
            return;
        }
        /* eslint-disable @typescript-eslint/dot-notation */
        if (changes.readOnly) {
            this.quillEditor.enable(!changes.readOnly.currentValue);
        }
        if (changes.placeholder) {
            this.quillEditor.root.dataset.placeholder =
                changes.placeholder.currentValue;
        }
        if (changes.defaultEmptyValue) {
            this.quillEditor.root.dataset.defaultEmptyValue =
                changes.defaultEmptyValue.currentValue;
        }
        if (changes.styles) {
            const currentStyling = changes.styles.currentValue;
            const previousStyling = changes.styles.previousValue;
            if (previousStyling) {
                Object.keys(previousStyling).forEach((key) => {
                    this.renderer.removeStyle(this.editorElem, key);
                });
            }
            if (currentStyling) {
                Object.keys(currentStyling).forEach((key) => {
                    this.renderer.setStyle(this.editorElem, key, this.styles[key]);
                });
            }
        }
        if (changes.classes) {
            const currentClasses = changes.classes.currentValue;
            const previousClasses = changes.classes.previousValue;
            if (previousClasses) {
                this.removeClasses(previousClasses);
            }
            if (currentClasses) {
                this.addClasses(currentClasses);
            }
        }
        // We'd want to re-apply event listeners if the `debounceTime` binding changes to apply the
        // `debounceTime` operator or vice-versa remove it.
        if (changes.debounceTime) {
            this.addQuillEventListeners();
        }
        /* eslint-enable @typescript-eslint/dot-notation */
    }
    addClasses(classList) {
        QuillEditorBase.normalizeClassNames(classList).forEach((c) => {
            this.renderer.addClass(this.editorElem, c);
        });
    }
    removeClasses(classList) {
        QuillEditorBase.normalizeClassNames(classList).forEach((c) => {
            this.renderer.removeClass(this.editorElem, c);
        });
    }
    writeValue(currentValue) {
        // optional fix for https://github.com/angular/angular/issues/14988
        if (this.filterNull && currentValue === null) {
            return;
        }
        this.content = currentValue;
        if (!this.quillEditor) {
            return;
        }
        const format = getFormat(this.format, this.service.config.format);
        const newValue = this.valueSetter(this.quillEditor, currentValue);
        if (this.compareValues) {
            const currentEditorValue = this.quillEditor.getContents();
            if (JSON.stringify(currentEditorValue) === JSON.stringify(newValue)) {
                return;
            }
        }
        if (currentValue) {
            if (format === 'text') {
                this.quillEditor.setText(currentValue);
            }
            else {
                this.quillEditor.setContents(newValue);
            }
            return;
        }
        this.quillEditor.setText('');
    }
    setDisabledState(isDisabled = this.disabled) {
        // store initial value to set appropriate disabled status after ViewInit
        this.disabled = isDisabled;
        if (this.quillEditor) {
            if (isDisabled) {
                this.quillEditor.disable();
                this.renderer.setAttribute(this.elementRef.nativeElement, 'disabled', 'disabled');
            }
            else {
                if (!this.readOnly) {
                    this.quillEditor.enable();
                }
                this.renderer.removeAttribute(this.elementRef.nativeElement, 'disabled');
            }
        }
    }
    registerOnChange(fn) {
        this.onModelChange = fn;
    }
    registerOnTouched(fn) {
        this.onModelTouched = fn;
    }
    registerOnValidatorChange(fn) {
        this.onValidatorChanged = fn;
    }
    validate() {
        if (!this.quillEditor) {
            return null;
        }
        const err = {};
        let valid = true;
        const text = this.quillEditor.getText();
        // trim text if wanted + handle special case that an empty editor contains a new line
        const textLength = this.trimOnValidation ? text.trim().length : (text.length === 1 && text.trim().length === 0 ? 0 : text.length - 1);
        const deltaOperations = this.quillEditor.getContents().ops;
        const onlyEmptyOperation = deltaOperations && deltaOperations.length === 1 && ['\n', ''].includes(deltaOperations[0].insert);
        if (this.minLength && textLength && textLength < this.minLength) {
            err.minLengthError = {
                given: textLength,
                minLength: this.minLength
            };
            valid = false;
        }
        if (this.maxLength && textLength > this.maxLength) {
            err.maxLengthError = {
                given: textLength,
                maxLength: this.maxLength
            };
            valid = false;
        }
        if (this.required && !textLength && onlyEmptyOperation) {
            err.requiredError = {
                empty: true
            };
            valid = false;
        }
        return valid ? null : err;
    }
    addQuillEventListeners() {
        this.dispose();
        // We have to enter the `<root>` zone when adding event listeners, so `debounceTime` will spawn the
        // `AsyncAction` there w/o triggering change detections. We still re-enter the Angular's zone through
        // `zone.run` when we emit an event to the parent component.
        this.zone.runOutsideAngular(() => {
            this.subscription = new Subscription();
            this.subscription.add(
            // mark model as touched if editor lost focus
            fromEvent(this.quillEditor, 'selection-change').subscribe(([range, oldRange, source]) => {
                this.selectionChangeHandler(range, oldRange, source);
            }));
            // The `fromEvent` supports passing JQuery-style event targets, the editor has `on` and `off` methods which
            // will be invoked upon subscription and teardown.
            let textChange$ = fromEvent(this.quillEditor, 'text-change');
            let editorChange$ = fromEvent(this.quillEditor, 'editor-change');
            if (typeof this.debounceTime === 'number') {
                textChange$ = textChange$.pipe(debounceTime(this.debounceTime));
                editorChange$ = editorChange$.pipe(debounceTime(this.debounceTime));
            }
            this.subscription.add(
            // update model if text changes
            textChange$.subscribe(([delta, oldDelta, source]) => {
                this.textChangeHandler(delta, oldDelta, source);
            }));
            this.subscription.add(
            // triggered if selection or text changed
            editorChange$.subscribe(([event, current, old, source]) => {
                this.editorChangeHandler(event, current, old, source);
            }));
        });
    }
    dispose() {
        if (this.subscription !== null) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }
}
QuillEditorBase.ɵfac = function QuillEditorBase_Factory(t) { return new (t || QuillEditorBase)(i0.ɵɵdirectiveInject(i0.Injector), i0.ɵɵdirectiveInject(i0.ElementRef), i0.ɵɵdirectiveInject(i0.ChangeDetectorRef), i0.ɵɵdirectiveInject(i1.DomSanitizer), i0.ɵɵdirectiveInject(PLATFORM_ID), i0.ɵɵdirectiveInject(i0.Renderer2), i0.ɵɵdirectiveInject(i0.NgZone), i0.ɵɵdirectiveInject(i2.QuillService)); };
QuillEditorBase.ɵdir = /*@__PURE__*/ i0.ɵɵdefineDirective({ type: QuillEditorBase, inputs: { format: "format", theme: "theme", modules: "modules", debug: "debug", readOnly: "readOnly", placeholder: "placeholder", maxLength: "maxLength", minLength: "minLength", required: "required", formats: "formats", customToolbarPosition: "customToolbarPosition", sanitize: "sanitize", styles: "styles", strict: "strict", scrollingContainer: "scrollingContainer", bounds: "bounds", customOptions: "customOptions", customModules: "customModules", trackChanges: "trackChanges", preserveWhitespace: "preserveWhitespace", classes: "classes", trimOnValidation: "trimOnValidation", linkPlaceholder: "linkPlaceholder", compareValues: "compareValues", filterNull: "filterNull", debounceTime: "debounceTime", defaultEmptyValue: "defaultEmptyValue", valueGetter: "valueGetter", valueSetter: "valueSetter" }, outputs: { onEditorCreated: "onEditorCreated", onEditorChanged: "onEditorChanged", onContentChanged: "onContentChanged", onSelectionChanged: "onSelectionChanged", onFocus: "onFocus", onBlur: "onBlur" }, features: [i0.ɵɵNgOnChangesFeature] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuillEditorBase, [{
        type: Directive
    }], function () { return [{ type: i0.Injector }, { type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: i1.DomSanitizer }, { type: undefined, decorators: [{
                type: Inject,
                args: [PLATFORM_ID]
            }] }, { type: i0.Renderer2 }, { type: i0.NgZone }, { type: i2.QuillService }]; }, { format: [{
            type: Input
        }], theme: [{
            type: Input
        }], modules: [{
            type: Input
        }], debug: [{
            type: Input
        }], readOnly: [{
            type: Input
        }], placeholder: [{
            type: Input
        }], maxLength: [{
            type: Input
        }], minLength: [{
            type: Input
        }], required: [{
            type: Input
        }], formats: [{
            type: Input
        }], customToolbarPosition: [{
            type: Input
        }], sanitize: [{
            type: Input
        }], styles: [{
            type: Input
        }], strict: [{
            type: Input
        }], scrollingContainer: [{
            type: Input
        }], bounds: [{
            type: Input
        }], customOptions: [{
            type: Input
        }], customModules: [{
            type: Input
        }], trackChanges: [{
            type: Input
        }], preserveWhitespace: [{
            type: Input
        }], classes: [{
            type: Input
        }], trimOnValidation: [{
            type: Input
        }], linkPlaceholder: [{
            type: Input
        }], compareValues: [{
            type: Input
        }], filterNull: [{
            type: Input
        }], debounceTime: [{
            type: Input
        }], defaultEmptyValue: [{
            type: Input
        }], onEditorCreated: [{
            type: Output
        }], onEditorChanged: [{
            type: Output
        }], onContentChanged: [{
            type: Output
        }], onSelectionChanged: [{
            type: Output
        }], onFocus: [{
            type: Output
        }], onBlur: [{
            type: Output
        }], valueGetter: [{
            type: Input
        }], valueSetter: [{
            type: Input
        }] }); })();
export class QuillEditorComponent extends QuillEditorBase {
    constructor(injector, elementRef, cd, domSanitizer, platformId, renderer, zone, service) {
        super(injector, elementRef, cd, domSanitizer, platformId, renderer, zone, service);
    }
}
QuillEditorComponent.ɵfac = function QuillEditorComponent_Factory(t) { return new (t || QuillEditorComponent)(i0.ɵɵdirectiveInject(i0.Injector), i0.ɵɵdirectiveInject(ElementRef), i0.ɵɵdirectiveInject(ChangeDetectorRef), i0.ɵɵdirectiveInject(DomSanitizer), i0.ɵɵdirectiveInject(PLATFORM_ID), i0.ɵɵdirectiveInject(Renderer2), i0.ɵɵdirectiveInject(NgZone), i0.ɵɵdirectiveInject(QuillService)); };
QuillEditorComponent.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: QuillEditorComponent, selectors: [["quill-editor"]], features: [i0.ɵɵProvidersFeature([
            {
                multi: true,
                provide: NG_VALUE_ACCESSOR,
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                useExisting: forwardRef(() => QuillEditorComponent)
            },
            {
                multi: true,
                provide: NG_VALIDATORS,
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                useExisting: forwardRef(() => QuillEditorComponent)
            }
        ]), i0.ɵɵInheritDefinitionFeature], ngContentSelectors: _c1, decls: 1, vars: 0, template: function QuillEditorComponent_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵprojectionDef(_c0);
        i0.ɵɵprojection(0);
    } }, styles: [":host{display:inline-block}\n"], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuillEditorComponent, [{
        type: Component,
        args: [{
                encapsulation: ViewEncapsulation.None,
                providers: [
                    {
                        multi: true,
                        provide: NG_VALUE_ACCESSOR,
                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                        useExisting: forwardRef(() => QuillEditorComponent)
                    },
                    {
                        multi: true,
                        provide: NG_VALIDATORS,
                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                        useExisting: forwardRef(() => QuillEditorComponent)
                    }
                ],
                selector: 'quill-editor',
                template: `
  <ng-content select="[quill-editor-toolbar]"></ng-content>
`,
                styles: [
                    `
    :host {
      display: inline-block;
    }
    `
                ]
            }]
    }], function () { return [{ type: i0.Injector }, { type: i0.ElementRef, decorators: [{
                type: Inject,
                args: [ElementRef]
            }] }, { type: i0.ChangeDetectorRef, decorators: [{
                type: Inject,
                args: [ChangeDetectorRef]
            }] }, { type: i1.DomSanitizer, decorators: [{
                type: Inject,
                args: [DomSanitizer]
            }] }, { type: undefined, decorators: [{
                type: Inject,
                args: [PLATFORM_ID]
            }] }, { type: i0.Renderer2, decorators: [{
                type: Inject,
                args: [Renderer2]
            }] }, { type: i0.NgZone, decorators: [{
                type: Inject,
                args: [NgZone]
            }] }, { type: i2.QuillService, decorators: [{
                type: Inject,
                args: [QuillService]
            }] }]; }, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpbGwtZWRpdG9yLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1xdWlsbC9zcmMvbGliL3F1aWxsLWVkaXRvci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBQzVELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQU14RCxPQUFPLEVBRUwsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsTUFBTSxFQUVOLEtBQUssRUFDTCxNQUFNLEVBR04sTUFBTSxFQUNOLFdBQVcsRUFDWCxTQUFTLEVBQ1QsZUFBZSxFQUVmLGlCQUFpQixFQUNsQixNQUFNLGVBQWUsQ0FBQTtBQUN0QixPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxNQUFNLE1BQU0sQ0FBQTtBQUM5QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFFN0MsT0FBTyxFQUF3QixhQUFhLEVBQUUsaUJBQWlCLEVBQWEsTUFBTSxnQkFBZ0IsQ0FBQTtBQUNsRyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFFakQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUNyQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUE7Ozs7OztBQXNDOUMsa0VBQWtFO0FBQ2xFLE1BQU0sT0FBZ0IsZUFBZTtJQThEbkMsWUFDRSxRQUFrQixFQUNYLFVBQXNCLEVBQ25CLEVBQXFCLEVBQ3JCLFlBQTBCLEVBQ0wsVUFBZSxFQUNwQyxRQUFtQixFQUNuQixJQUFZLEVBQ1osT0FBcUI7UUFOeEIsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUNuQixPQUFFLEdBQUYsRUFB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V0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQzthQUNwRDtZQUNEO2dCQUNFLEtBQUssRUFBRSxJQUFJO2dCQUNYLE9BQU8sRUFBRSxhQUFhO2dCQUN0QixtRUFBbUU7Z0JBQ25FLFdBQVcsRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUM7YUFDcEQ7U0FDRjs7UUFHRCxrQkFBeUQ7O3VGQVU5QyxvQkFBb0I7Y0E1QmhDLFNBQVM7ZUFBQztnQkFDVCxhQUFhLEVBQUUsaUJBQWlCLENBQUMsSUFBSTtnQkFDckMsU0FBUyxFQUFFO29CQUNUO3dCQUNFLEtBQUssRUFBRSxJQUFJO3dCQUNYLE9BQU8sRUFBRSxpQkFBaUI7d0JBQzFCLG1FQUFtRTt3QkFDbkUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUscUJBQXFCLENBQUM7cUJBQ3BEO29CQUNEO3dCQUNFLEtBQUssRUFBRSxJQUFJO3dCQUNYLE9BQU8sRUFBRSxhQUFhO3dCQUN0QixtRUFBbUU7d0JBQ25FLFdBQVcsRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLHFCQUFxQixDQUFDO3FCQUNwRDtpQkFDRjtnQkFDRCxRQUFRLEVBQUUsY0FBYztnQkFDeEIsUUFBUSxFQUFFOztDQUVYO2dCQUNDLE1BQU0sRUFBRTtvQkFDTjs7OztLQUlDO2lCQUNGO2FBQ0Y7O3NCQUtJLE1BQU07dUJBQUMsVUFBVTs7c0JBQ2pCLE1BQU07dUJBQUMsaUJBQWlCOztzQkFDeEIsTUFBTTt1QkFBQyxZQUFZOztzQkFDbkIsTUFBTTt1QkFBQyxXQUFXOztzQkFDbEIsTUFBTTt1QkFBQyxTQUFTOztzQkFDaEIsTUFBTTt1QkFBQyxNQUFNOztzQkFDYixNQUFNO3VCQUFDLFlBQVkiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBET0NVTUVOVCwgaXNQbGF0Zm9ybVNlcnZlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbidcbmltcG9ydCB7IERvbVNhbml0aXplciB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInXG5cbmltcG9ydCB7IFF1aWxsTW9kdWxlcywgQ3VzdG9tT3B0aW9uLCBDdXN0b21Nb2R1bGUgfSBmcm9tICcuL3F1aWxsLWVkaXRvci5pbnRlcmZhY2VzJ1xuXG5pbXBvcnQgUXVpbGxUeXBlLCB7IERlbHRhIH0gZnJvbSAncXVpbGwnXG5cbmltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBmb3J3YXJkUmVmLFxuICBJbmplY3QsXG4gIEluamVjdG9yLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxuICBQTEFURk9STV9JRCxcbiAgUmVuZGVyZXIyLFxuICBTZWN1cml0eUNvbnRleHQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFZpZXdFbmNhcHN1bGF0aW9uXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnXG5pbXBvcnQgeyBmcm9tRXZlbnQsIFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnXG5pbXBvcnQgeyBkZWJvdW5jZVRpbWUgfSBmcm9tICdyeGpzL29wZXJhdG9ycydcblxuaW1wb3J0IHsgQ29udHJvbFZhbHVlQWNjZXNzb3IsIE5HX1ZBTElEQVRPUlMsIE5HX1ZBTFVFX0FDQ0VTU09SLCBWYWxpZGF0b3IgfSBmcm9tICdAYW5ndWxhci9mb3JtcydcbmltcG9ydCB7IGRlZmF1bHRNb2R1bGVzIH0gZnJvbSAnLi9xdWlsbC1kZWZhdWx0cydcblxuaW1wb3J0IHsgZ2V0Rm9ybWF0IH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IHsgUXVpbGxTZXJ2aWNlIH0gZnJvbSAnLi9xdWlsbC5zZXJ2aWNlJ1xuXG5leHBvcnQgaW50ZXJmYWNlIFJhbmdlIHtcbiAgaW5kZXg6IG51bWJlclxuICBsZW5ndGg6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnRlbnRDaGFuZ2Uge1xuICBjb250ZW50OiBhbnlcbiAgZGVsdGE6IERlbHRhXG4gIGVkaXRvcjogUXVpbGxUeXBlXG4gIGh0bWw6IHN0cmluZyB8IG51bGxcbiAgb2xkRGVsdGE6IERlbHRhXG4gIHNvdXJjZTogc3RyaW5nXG4gIHRleHQ6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdGlvbkNoYW5nZSB7XG4gIGVkaXRvcjogUXVpbGxUeXBlXG4gIG9sZFJhbmdlOiBSYW5nZSB8IG51bGxcbiAgcmFuZ2U6IFJhbmdlIHwgbnVsbFxuICBzb3VyY2U6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJsdXIge1xuICBlZGl0b3I6IFF1aWxsVHlwZVxuICBzb3VyY2U6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzIHtcbiAgZWRpdG9yOiBRdWlsbFR5cGVcbiAgc291cmNlOiBzdHJpbmdcbn1cblxuZXhwb3J0IHR5cGUgRWRpdG9yQ2hhbmdlQ29udGVudCA9IENvbnRlbnRDaGFuZ2UgJiB7IGV2ZW50OiAndGV4dC1jaGFuZ2UnIH1cbmV4cG9ydCB0eXBlIEVkaXRvckNoYW5nZVNlbGVjdGlvbiA9IFNlbGVjdGlvbkNoYW5nZSAmIHsgZXZlbnQ6ICdzZWxlY3Rpb24tY2hhbmdlJyB9XG5cbkBEaXJlY3RpdmUoKVxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEBhbmd1bGFyLWVzbGludC9kaXJlY3RpdmUtY2xhc3Mtc3VmZml4XG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUXVpbGxFZGl0b3JCYXNlIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgQ29udHJvbFZhbHVlQWNjZXNzb3IsIE9uQ2hhbmdlcywgT25EZXN0cm95LCBWYWxpZGF0b3Ige1xuICBASW5wdXQoKSBmb3JtYXQ/OiAnb2JqZWN0JyB8ICdodG1sJyB8ICd0ZXh0JyB8ICdqc29uJ1xuICBASW5wdXQoKSB0aGVtZT86IHN0cmluZ1xuICBASW5wdXQoKSBtb2R1bGVzPzogUXVpbGxNb2R1bGVzXG4gIEBJbnB1dCgpIGRlYnVnPzogJ3dhcm4nIHwgJ2xvZycgfCAnZXJyb3InIHwgZmFsc2VcbiAgQElucHV0KCkgcmVhZE9ubHk/OiBib29sZWFuXG4gIEBJbnB1dCgpIHBsYWNlaG9sZGVyPzogc3RyaW5nXG4gIEBJbnB1dCgpIG1heExlbmd0aD86IG51bWJlclxuICBASW5wdXQoKSBtaW5MZW5ndGg/OiBudW1iZXJcbiAgQElucHV0KCkgcmVxdWlyZWQgPSBmYWxzZVxuICBASW5wdXQoKSBmb3JtYXRzPzogc3RyaW5nW10gfCBudWxsXG4gIEBJbnB1dCgpIGN1c3RvbVRvb2xiYXJQb3NpdGlvbjogJ3RvcCcgfCAnYm90dG9tJyA9ICd0b3AnXG4gIEBJbnB1dCgpIHNhbml0aXplPzogYm9vbGVhblxuICBASW5wdXQoKSBzdHlsZXM6IGFueSA9IG51bGxcbiAgQElucHV0KCkgc3RyaWN0ID0gdHJ1ZVxuICBASW5wdXQoKSBzY3JvbGxpbmdDb250YWluZXI/OiBIVE1MRWxlbWVudCB8IHN0cmluZyB8IG51bGxcbiAgQElucHV0KCkgYm91bmRzPzogSFRNTEVsZW1lbnQgfCBzdHJpbmdcbiAgQElucHV0KCkgY3VzdG9tT3B0aW9uczogQ3VzdG9tT3B0aW9uW10gPSBbXVxuICBASW5wdXQoKSBjdXN0b21Nb2R1bGVzOiBDdXN0b21Nb2R1bGVbXSA9IFtdXG4gIEBJbnB1dCgpIHRyYWNrQ2hhbmdlcz86ICd1c2VyJyB8ICdhbGwnXG4gIEBJbnB1dCgpIHByZXNlcnZlV2hpdGVzcGFjZSA9IGZhbHNlXG4gIEBJbnB1dCgpIGNsYXNzZXM/OiBzdHJpbmdcbiAgQElucHV0KCkgdHJpbU9uVmFsaWRhdGlvbiA9IGZhbHNlXG4gIEBJbnB1dCgpIGxpbmtQbGFjZWhvbGRlcj86IHN0cmluZ1xuICBASW5wdXQoKSBjb21wYXJlVmFsdWVzID0gZmFsc2VcbiAgQElucHV0KCkgZmlsdGVyTnVsbCA9IGZhbHNlXG4gIEBJbnB1dCgpIGRlYm91bmNlVGltZT86IG51bWJlclxuICAvKlxuICBodHRwczovL2dpdGh1Yi5jb20vS2lsbGVyQ29kZU1vbmtleS9uZ3gtcXVpbGwvaXNzdWVzLzEyNTcgLSBmaXggbnVsbCB2YWx1ZSBzZXRcblxuICBwcm92aWRlIGRlZmF1bHQgZW1wdHkgdmFsdWVcbiAgYnkgZGVmYXVsdCBudWxsXG5cbiAgZS5nLiBkZWZhdWx0RW1wdHlWYWx1ZT1cIlwiIC0gZW1wdHkgc3RyaW5nXG5cbiAgPHF1aWxsLWVkaXRvclxuICAgIGRlZmF1bHRFbXB0eVZhbHVlPVwiXCJcbiAgICBmb3JtQ29udHJvbE5hbWU9XCJtZXNzYWdlXCJcbiAgPjwvcXVpbGwtZWRpdG9yPlxuICAqL1xuICBASW5wdXQoKSBkZWZhdWx0RW1wdHlWYWx1ZT86IGFueSA9IG51bGxcblxuICBAT3V0cHV0KCkgb25FZGl0b3JDcmVhdGVkOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICBAT3V0cHV0KCkgb25FZGl0b3JDaGFuZ2VkOiBFdmVudEVtaXR0ZXI8RWRpdG9yQ2hhbmdlQ29udGVudCB8IEVkaXRvckNoYW5nZVNlbGVjdGlvbj4gPSBuZXcgRXZlbnRFbWl0dGVyKClcbiAgQE91dHB1dCgpIG9uQ29udGVudENoYW5nZWQ6IEV2ZW50RW1pdHRlcjxDb250ZW50Q2hhbmdlPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICBAT3V0cHV0KCkgb25TZWxlY3Rpb25DaGFuZ2VkOiBFdmVudEVtaXR0ZXI8U2VsZWN0aW9uQ2hhbmdlPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICBAT3V0cHV0KCkgb25Gb2N1czogRXZlbnRFbWl0dGVyPEZvY3VzPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICBAT3V0cHV0KCkgb25CbHVyOiBFdmVudEVtaXR0ZXI8Qmx1cj4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBxdWlsbEVkaXRvciE6IFF1aWxsVHlwZVxuICBlZGl0b3JFbGVtITogSFRNTEVsZW1lbnRcbiAgY29udGVudDogYW55XG4gIGRpc2FibGVkID0gZmFsc2UgLy8gdXNlZCB0byBzdG9yZSBpbml0aWFsIHZhbHVlIGJlZm9yZSBWaWV3SW5pdFxuXG4gIG9uTW9kZWxDaGFuZ2U6IChtb2RlbFZhbHVlPzogYW55KSA9PiB2b2lkXG4gIG9uTW9kZWxUb3VjaGVkOiAoKSA9PiB2b2lkXG4gIG9uVmFsaWRhdG9yQ2hhbmdlZDogKCkgPT4gdm9pZFxuXG4gIHByaXZhdGUgZG9jdW1lbnQ6IERvY3VtZW50XG4gIHByaXZhdGUgc3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsID0gbnVsbFxuICBwcml2YXRlIHF1aWxsU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsID0gbnVsbFxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGluamVjdG9yOiBJbmplY3RvcixcbiAgICBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBwcm90ZWN0ZWQgY2Q6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByb3RlY3RlZCBkb21TYW5pdGl6ZXI6IERvbVNhbml0aXplcixcbiAgICBASW5qZWN0KFBMQVRGT1JNX0lEKSBwcm90ZWN0ZWQgcGxhdGZvcm1JZDogYW55LFxuICAgIHByb3RlY3RlZCByZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgIHByb3RlY3RlZCB6b25lOiBOZ1pvbmUsXG4gICAgcHJvdGVjdGVkIHNlcnZpY2U6IFF1aWxsU2VydmljZVxuICApIHtcbiAgICB0aGlzLmRvY3VtZW50ID0gaW5qZWN0b3IuZ2V0KERPQ1VNRU5UKVxuICB9XG5cbiAgc3RhdGljIG5vcm1hbGl6ZUNsYXNzTmFtZXMoY2xhc3Nlczogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGNsYXNzTGlzdCA9IGNsYXNzZXMudHJpbSgpLnNwbGl0KCcgJylcbiAgICByZXR1cm4gY2xhc3NMaXN0LnJlZHVjZSgocHJldjogc3RyaW5nW10sIGN1cjogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCB0cmltbWVkID0gY3VyLnRyaW0oKVxuICAgICAgaWYgKHRyaW1tZWQpIHtcbiAgICAgICAgcHJldi5wdXNoKHRyaW1tZWQpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcmV2XG4gICAgfSwgW10pXG4gIH1cblxuICBASW5wdXQoKVxuICB2YWx1ZUdldHRlciA9IChxdWlsbEVkaXRvcjogUXVpbGxUeXBlLCBlZGl0b3JFbGVtZW50OiBIVE1MRWxlbWVudCk6IHN0cmluZyB8IGFueSA9PiB7XG4gICAgbGV0IGh0bWw6IHN0cmluZyB8IG51bGwgPSBlZGl0b3JFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5xbC1lZGl0b3InKSEuaW5uZXJIVE1MXG4gICAgaWYgKGh0bWwgPT09ICc8cD48YnI+PC9wPicgfHwgaHRtbCA9PT0gJzxkaXY+PGJyPjwvZGl2PicpIHtcbiAgICAgIGh0bWwgPSB0aGlzLmRlZmF1bHRFbXB0eVZhbHVlXG4gICAgfVxuICAgIGxldCBtb2RlbFZhbHVlOiBzdHJpbmcgfCBEZWx0YSB8IG51bGwgPSBodG1sXG4gICAgY29uc3QgZm9ybWF0ID0gZ2V0Rm9ybWF0KHRoaXMuZm9ybWF0LCB0aGlzLnNlcnZpY2UuY29uZmlnLmZvcm1hdClcblxuICAgIGlmIChmb3JtYXQgPT09ICd0ZXh0Jykge1xuICAgICAgbW9kZWxWYWx1ZSA9IHF1aWxsRWRpdG9yLmdldFRleHQoKVxuICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAnb2JqZWN0Jykge1xuICAgICAgbW9kZWxWYWx1ZSA9IHF1aWxsRWRpdG9yLmdldENvbnRlbnRzKClcbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2pzb24nKSB7XG4gICAgICB0cnkge1xuICAgICAgICBtb2RlbFZhbHVlID0gSlNPTi5zdHJpbmdpZnkocXVpbGxFZGl0b3IuZ2V0Q29udGVudHMoKSlcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgbW9kZWxWYWx1ZSA9IHF1aWxsRWRpdG9yLmdldFRleHQoKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtb2RlbFZhbHVlXG4gIH1cblxuICBASW5wdXQoKVxuICB2YWx1ZVNldHRlciA9IChxdWlsbEVkaXRvcjogUXVpbGxUeXBlLCB2YWx1ZTogYW55KTogYW55ID0+IHtcbiAgICBjb25zdCBmb3JtYXQgPSBnZXRGb3JtYXQodGhpcy5mb3JtYXQsIHRoaXMuc2VydmljZS5jb25maWcuZm9ybWF0KVxuICAgIGlmIChmb3JtYXQgPT09ICdodG1sJykge1xuICAgICAgY29uc3Qgc2FuaXRpemUgPSBbdHJ1ZSwgZmFsc2VdLmluY2x1ZGVzKHRoaXMuc2FuaXRpemUpID8gdGhpcy5zYW5pdGl6ZSA6ICh0aGlzLnNlcnZpY2UuY29uZmlnLnNhbml0aXplIHx8IGZhbHNlKVxuICAgICAgaWYgKHNhbml0aXplKSB7XG4gICAgICAgIHZhbHVlID0gdGhpcy5kb21TYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LkhUTUwsIHZhbHVlKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHF1aWxsRWRpdG9yLmNsaXBib2FyZC5jb252ZXJ0KHZhbHVlKVxuICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAnanNvbicpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHZhbHVlKVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gW3sgaW5zZXJ0OiB2YWx1ZSB9XVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIGlmIChpc1BsYXRmb3JtU2VydmVyKHRoaXMucGxhdGZvcm1JZCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIFRoZSBgcXVpbGwtZWRpdG9yYCBjb21wb25lbnQgbWlnaHQgYmUgZGVzdHJveWVkIGJlZm9yZSB0aGUgYHF1aWxsYCBjaHVuayBpcyBsb2FkZWQgYW5kIGl0cyBjb2RlIGlzIGV4ZWN1dGVkXG4gICAgLy8gdGhpcyB3aWxsIGxlYWQgdG8gcnVudGltZSBleGNlcHRpb25zLCBzaW5jZSB0aGUgY29kZSB3aWxsIGJlIGV4ZWN1dGVkIG9uIERPTSBub2RlcyB0aGF0IGRvbid0IGV4aXN0IHdpdGhpbiB0aGUgdHJlZS5cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb25cbiAgICB0aGlzLnF1aWxsU3Vic2NyaXB0aW9uID0gdGhpcy5zZXJ2aWNlLmdldFF1aWxsKCkuc3Vic2NyaWJlKFF1aWxsID0+IHtcbiAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcbiAgICAgICAgdGhpcy5jdXN0b21Ub29sYmFyUG9zaXRpb24gPT09ICd0b3AnID8gJ2JlZm9yZWVuZCcgOiAnYWZ0ZXJiZWdpbicsXG4gICAgICAgIHRoaXMucHJlc2VydmVXaGl0ZXNwYWNlID8gJzxwcmUgcXVpbGwtZWRpdG9yLWVsZW1lbnQ+PC9wcmU+JyA6ICc8ZGl2IHF1aWxsLWVkaXRvci1lbGVtZW50PjwvZGl2PidcbiAgICAgIClcblxuICAgICAgdGhpcy5lZGl0b3JFbGVtID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgJ1txdWlsbC1lZGl0b3ItZWxlbWVudF0nXG4gICAgICApXG5cbiAgICAgIGNvbnN0IHRvb2xiYXJFbGVtID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgJ1txdWlsbC1lZGl0b3ItdG9vbGJhcl0nXG4gICAgICApXG4gICAgICBjb25zdCBtb2R1bGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5tb2R1bGVzIHx8IHRoaXMuc2VydmljZS5jb25maWcubW9kdWxlcylcblxuICAgICAgaWYgKHRvb2xiYXJFbGVtKSB7XG4gICAgICAgIG1vZHVsZXMudG9vbGJhciA9IHRvb2xiYXJFbGVtXG4gICAgICB9IGVsc2UgaWYgKG1vZHVsZXMudG9vbGJhciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1vZHVsZXMudG9vbGJhciA9IGRlZmF1bHRNb2R1bGVzLnRvb2xiYXJcbiAgICAgIH1cblxuICAgICAgbGV0IHBsYWNlaG9sZGVyID0gdGhpcy5wbGFjZWhvbGRlciAhPT0gdW5kZWZpbmVkID8gdGhpcy5wbGFjZWhvbGRlciA6IHRoaXMuc2VydmljZS5jb25maWcucGxhY2Vob2xkZXJcbiAgICAgIGlmIChwbGFjZWhvbGRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHBsYWNlaG9sZGVyID0gJ0luc2VydCB0ZXh0IGhlcmUgLi4uJ1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zdHlsZXMpIHtcbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5zdHlsZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmVkaXRvckVsZW0sIGtleSwgdGhpcy5zdHlsZXNba2V5XSlcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuY2xhc3Nlcykge1xuICAgICAgICB0aGlzLmFkZENsYXNzZXModGhpcy5jbGFzc2VzKVxuICAgICAgfVxuXG4gICAgICB0aGlzLmN1c3RvbU9wdGlvbnMuZm9yRWFjaCgoY3VzdG9tT3B0aW9uKSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld0N1c3RvbU9wdGlvbiA9IFF1aWxsLmltcG9ydChjdXN0b21PcHRpb24uaW1wb3J0KVxuICAgICAgICBuZXdDdXN0b21PcHRpb24ud2hpdGVsaXN0ID0gY3VzdG9tT3B0aW9uLndoaXRlbGlzdFxuICAgICAgICBRdWlsbC5yZWdpc3RlcihuZXdDdXN0b21PcHRpb24sIHRydWUpXG4gICAgICB9KVxuXG4gICAgICB0aGlzLmN1c3RvbU1vZHVsZXMuZm9yRWFjaCgoeyBpbXBsZW1lbnRhdGlvbiwgcGF0aCB9KSA9PiB7XG4gICAgICAgIFF1aWxsLnJlZ2lzdGVyKHBhdGgsIGltcGxlbWVudGF0aW9uKVxuICAgICAgfSlcblxuICAgICAgbGV0IGJvdW5kcyA9IHRoaXMuYm91bmRzICYmIHRoaXMuYm91bmRzID09PSAnc2VsZicgPyB0aGlzLmVkaXRvckVsZW0gOiB0aGlzLmJvdW5kc1xuICAgICAgaWYgKCFib3VuZHMpIHtcbiAgICAgICAgYm91bmRzID0gdGhpcy5zZXJ2aWNlLmNvbmZpZy5ib3VuZHMgPyB0aGlzLnNlcnZpY2UuY29uZmlnLmJvdW5kcyA6IHRoaXMuZG9jdW1lbnQuYm9keVxuICAgICAgfVxuXG4gICAgICBsZXQgZGVidWcgPSB0aGlzLmRlYnVnXG4gICAgICBpZiAoIWRlYnVnICYmIGRlYnVnICE9PSBmYWxzZSAmJiB0aGlzLnNlcnZpY2UuY29uZmlnLmRlYnVnKSB7XG4gICAgICAgIGRlYnVnID0gdGhpcy5zZXJ2aWNlLmNvbmZpZy5kZWJ1Z1xuICAgICAgfVxuXG4gICAgICBsZXQgcmVhZE9ubHkgPSB0aGlzLnJlYWRPbmx5XG4gICAgICBpZiAoIXJlYWRPbmx5ICYmIHRoaXMucmVhZE9ubHkgIT09IGZhbHNlKSB7XG4gICAgICAgIHJlYWRPbmx5ID0gdGhpcy5zZXJ2aWNlLmNvbmZpZy5yZWFkT25seSAhPT0gdW5kZWZpbmVkID8gdGhpcy5zZXJ2aWNlLmNvbmZpZy5yZWFkT25seSA6IGZhbHNlXG4gICAgICB9XG5cbiAgICAgIGxldCBkZWZhdWx0RW1wdHlWYWx1ZSA9IHRoaXMuZGVmYXVsdEVtcHR5VmFsdWVcbiAgICAgIGlmICh0aGlzLnNlcnZpY2UuY29uZmlnLmhhc093blByb3BlcnR5KCdkZWZhdWx0RW1wdHlWYWx1ZScpKSB7XG4gICAgICAgIGRlZmF1bHRFbXB0eVZhbHVlID0gdGhpcy5zZXJ2aWNlLmNvbmZpZy5kZWZhdWx0RW1wdHlWYWx1ZVxuICAgICAgfVxuXG4gICAgICBsZXQgc2Nyb2xsaW5nQ29udGFpbmVyID0gdGhpcy5zY3JvbGxpbmdDb250YWluZXJcbiAgICAgIGlmICghc2Nyb2xsaW5nQ29udGFpbmVyICYmIHRoaXMuc2Nyb2xsaW5nQ29udGFpbmVyICE9PSBudWxsKSB7XG4gICAgICAgIHNjcm9sbGluZ0NvbnRhaW5lciA9XG4gICAgICAgICAgdGhpcy5zZXJ2aWNlLmNvbmZpZy5zY3JvbGxpbmdDb250YWluZXIgPT09IG51bGxcbiAgICAgICAgICAgIHx8IHRoaXMuc2VydmljZS5jb25maWcuc2Nyb2xsaW5nQ29udGFpbmVyID8gdGhpcy5zZXJ2aWNlLmNvbmZpZy5zY3JvbGxpbmdDb250YWluZXIgOiBudWxsXG4gICAgICB9XG5cbiAgICAgIGxldCBmb3JtYXRzID0gdGhpcy5mb3JtYXRzXG4gICAgICBpZiAoIWZvcm1hdHMgJiYgZm9ybWF0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvcm1hdHMgPSB0aGlzLnNlcnZpY2UuY29uZmlnLmZvcm1hdHMgPyBbLi4udGhpcy5zZXJ2aWNlLmNvbmZpZy5mb3JtYXRzXSA6ICh0aGlzLnNlcnZpY2UuY29uZmlnLmZvcm1hdHMgPT09IG51bGwgPyBudWxsIDogdW5kZWZpbmVkKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICB0aGlzLnF1aWxsRWRpdG9yID0gbmV3IFF1aWxsKHRoaXMuZWRpdG9yRWxlbSwge1xuICAgICAgICAgIGJvdW5kcyxcbiAgICAgICAgICBkZWJ1ZzogZGVidWcgYXMgYW55LFxuICAgICAgICAgIGZvcm1hdHM6IGZvcm1hdHMgYXMgYW55LFxuICAgICAgICAgIG1vZHVsZXMsXG4gICAgICAgICAgcGxhY2Vob2xkZXIsXG4gICAgICAgICAgcmVhZE9ubHksXG4gICAgICAgICAgZGVmYXVsdEVtcHR5VmFsdWUsXG4gICAgICAgICAgc2Nyb2xsaW5nQ29udGFpbmVyOiBzY3JvbGxpbmdDb250YWluZXIgYXMgYW55LFxuICAgICAgICAgIHN0cmljdDogdGhpcy5zdHJpY3QsXG4gICAgICAgICAgdGhlbWU6IHRoaXMudGhlbWUgfHwgKHRoaXMuc2VydmljZS5jb25maWcudGhlbWUgPyB0aGlzLnNlcnZpY2UuY29uZmlnLnRoZW1lIDogJ3Nub3cnKVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIFNldCBvcHRpb25hbCBsaW5rIHBsYWNlaG9sZGVyLCBRdWlsbCBoYXMgbm8gbmF0aXZlIEFQSSBmb3IgaXQgc28gdXNpbmcgd29ya2Fyb3VuZFxuICAgICAgICBpZiAodGhpcy5saW5rUGxhY2Vob2xkZXIpIHtcbiAgICAgICAgICBjb25zdCB0b29sdGlwID0gKHRoaXMucXVpbGxFZGl0b3IgYXMgYW55KT8udGhlbWU/LnRvb2x0aXBcbiAgICAgICAgICBjb25zdCBpbnB1dCA9IHRvb2x0aXA/LnJvb3Q/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W2RhdGEtbGlua10nKVxuICAgICAgICAgIGlmIChpbnB1dD8uZGF0YXNldCkge1xuICAgICAgICAgICAgaW5wdXQuZGF0YXNldC5saW5rID0gdGhpcy5saW5rUGxhY2Vob2xkZXJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGlmICh0aGlzLmNvbnRlbnQpIHtcbiAgICAgICAgY29uc3QgZm9ybWF0ID0gZ2V0Rm9ybWF0KHRoaXMuZm9ybWF0LCB0aGlzLnNlcnZpY2UuY29uZmlnLmZvcm1hdClcblxuICAgICAgICBpZiAoZm9ybWF0ID09PSAndGV4dCcpIHtcbiAgICAgICAgICB0aGlzLnF1aWxsRWRpdG9yLnNldFRleHQodGhpcy5jb250ZW50LCAnc2lsZW50JylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IHRoaXMudmFsdWVTZXR0ZXIodGhpcy5xdWlsbEVkaXRvciwgdGhpcy5jb250ZW50KVxuICAgICAgICAgIHRoaXMucXVpbGxFZGl0b3Iuc2V0Q29udGVudHMobmV3VmFsdWUsICdzaWxlbnQnKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5xdWlsbEVkaXRvci5nZXRNb2R1bGUoJ2hpc3RvcnknKS5jbGVhcigpXG4gICAgICB9XG5cbiAgICAgIC8vIGluaXRpYWxpemUgZGlzYWJsZWQgc3RhdHVzIGJhc2VkIG9uIHRoaXMuZGlzYWJsZWQgYXMgZGVmYXVsdCB2YWx1ZVxuICAgICAgdGhpcy5zZXREaXNhYmxlZFN0YXRlKClcblxuICAgICAgdGhpcy5hZGRRdWlsbEV2ZW50TGlzdGVuZXJzKClcblxuICAgICAgLy8gVGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24uIFRoZXJlJ3Mgbm8gc2Vuc2UgdG8gaW52b2tlIHRoZSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBpZiBhbnlvbmUgaXNcbiAgICAgIC8vIGxpc3RlbmluZyB0byB0aGUgYG9uRWRpdG9yQ3JlYXRlZGAgZXZlbnQgaW5zaWRlIHRoZSB0ZW1wbGF0ZSwgZm9yIGluc3RhbmNlIGA8cXVpbGwtdmlldyAob25FZGl0b3JDcmVhdGVkKT1cIi4uLlwiPmAuXG4gICAgICBpZiAoIXRoaXMub25FZGl0b3JDcmVhdGVkLm9ic2VydmVycy5sZW5ndGggJiYgIXRoaXMub25WYWxpZGF0b3JDaGFuZ2VkKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyBUaGUgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgd2lsbCB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGBvbkVkaXRvckNyZWF0ZWRgIHdpbGwgYWxzbyBjYWxsIGBtYXJrRGlydHkoKWBcbiAgICAgIC8vIGludGVybmFsbHksIHNpbmNlIEFuZ3VsYXIgd3JhcHMgdGVtcGxhdGUgZXZlbnQgbGlzdGVuZXJzIGludG8gYGxpc3RlbmVyYCBpbnN0cnVjdGlvbi4gV2UncmUgdXNpbmcgdGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgXG4gICAgICAvLyB0byBwcmV2ZW50IHRoZSBmcmFtZSBkcm9wIGFuZCBhdm9pZCBgRXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcmAgZXJyb3IuXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5vblZhbGlkYXRvckNoYW5nZWQpIHtcbiAgICAgICAgICB0aGlzLm9uVmFsaWRhdG9yQ2hhbmdlZCgpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vbkVkaXRvckNyZWF0ZWQuZW1pdCh0aGlzLnF1aWxsRWRpdG9yKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgc2VsZWN0aW9uQ2hhbmdlSGFuZGxlciA9IChyYW5nZTogUmFuZ2UgfCBudWxsLCBvbGRSYW5nZTogUmFuZ2UgfCBudWxsLCBzb3VyY2U6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHNob3VsZFRyaWdnZXJPbk1vZGVsVG91Y2hlZCA9ICFyYW5nZSAmJiAhIXRoaXMub25Nb2RlbFRvdWNoZWRcblxuICAgIC8vIG9ubHkgZW1pdCBjaGFuZ2VzIHdoZW4gdGhlcmUncyBhbnkgbGlzdGVuZXJcbiAgICBpZiAoIXRoaXMub25CbHVyLm9ic2VydmVycy5sZW5ndGggJiZcbiAgICAgICF0aGlzLm9uRm9jdXMub2JzZXJ2ZXJzLmxlbmd0aCAmJlxuICAgICAgIXRoaXMub25TZWxlY3Rpb25DaGFuZ2VkLm9ic2VydmVycy5sZW5ndGggJiZcbiAgICAgICFzaG91bGRUcmlnZ2VyT25Nb2RlbFRvdWNoZWQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgaWYgKHJhbmdlID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMub25CbHVyLmVtaXQoe1xuICAgICAgICAgIGVkaXRvcjogdGhpcy5xdWlsbEVkaXRvcixcbiAgICAgICAgICBzb3VyY2VcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAob2xkUmFuZ2UgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5vbkZvY3VzLmVtaXQoe1xuICAgICAgICAgIGVkaXRvcjogdGhpcy5xdWlsbEVkaXRvcixcbiAgICAgICAgICBzb3VyY2VcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgdGhpcy5vblNlbGVjdGlvbkNoYW5nZWQuZW1pdCh7XG4gICAgICAgIGVkaXRvcjogdGhpcy5xdWlsbEVkaXRvcixcbiAgICAgICAgb2xkUmFuZ2UsXG4gICAgICAgIHJhbmdlLFxuICAgICAgICBzb3VyY2VcbiAgICAgIH0pXG5cbiAgICAgIGlmIChzaG91bGRUcmlnZ2VyT25Nb2RlbFRvdWNoZWQpIHtcbiAgICAgICAgdGhpcy5vbk1vZGVsVG91Y2hlZCgpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2QubWFya0ZvckNoZWNrKClcbiAgICB9KVxuICB9XG5cbiAgdGV4dENoYW5nZUhhbmRsZXIgPSAoZGVsdGE6IERlbHRhLCBvbGREZWx0YTogRGVsdGEsIHNvdXJjZTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgLy8gb25seSBlbWl0IGNoYW5nZXMgZW1pdHRlZCBieSB1c2VyIGludGVyYWN0aW9uc1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLnF1aWxsRWRpdG9yLmdldFRleHQoKVxuICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnF1aWxsRWRpdG9yLmdldENvbnRlbnRzKClcblxuICAgIGxldCBodG1sOiBzdHJpbmcgfCBudWxsID0gdGhpcy5lZGl0b3JFbGVtIS5xdWVyeVNlbGVjdG9yKCcucWwtZWRpdG9yJykhLmlubmVySFRNTFxuICAgIGlmIChodG1sID09PSAnPHA+PGJyPjwvcD4nIHx8IGh0bWwgPT09ICc8ZGl2Pjxicj48L2Rpdj4nKSB7XG4gICAgICBodG1sID0gdGhpcy5kZWZhdWx0RW1wdHlWYWx1ZVxuICAgIH1cblxuICAgIGNvbnN0IHRyYWNrQ2hhbmdlcyA9IHRoaXMudHJhY2tDaGFuZ2VzIHx8IHRoaXMuc2VydmljZS5jb25maWcudHJhY2tDaGFuZ2VzXG4gICAgY29uc3Qgc2hvdWxkVHJpZ2dlck9uTW9kZWxDaGFuZ2UgPSAoc291cmNlID09PSAndXNlcicgfHwgdHJhY2tDaGFuZ2VzICYmIHRyYWNrQ2hhbmdlcyA9PT0gJ2FsbCcpICYmICEhdGhpcy5vbk1vZGVsQ2hhbmdlXG5cbiAgICAvLyBvbmx5IGVtaXQgY2hhbmdlcyB3aGVuIHRoZXJlJ3MgYW55IGxpc3RlbmVyXG4gICAgaWYgKCF0aGlzLm9uQ29udGVudENoYW5nZWQub2JzZXJ2ZXJzLmxlbmd0aCAmJiAhc2hvdWxkVHJpZ2dlck9uTW9kZWxDaGFuZ2UpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgaWYgKHNob3VsZFRyaWdnZXJPbk1vZGVsQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMub25Nb2RlbENoYW5nZShcbiAgICAgICAgICB0aGlzLnZhbHVlR2V0dGVyKHRoaXMucXVpbGxFZGl0b3IsIHRoaXMuZWRpdG9yRWxlbSEpXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgdGhpcy5vbkNvbnRlbnRDaGFuZ2VkLmVtaXQoe1xuICAgICAgICBjb250ZW50LFxuICAgICAgICBkZWx0YSxcbiAgICAgICAgZWRpdG9yOiB0aGlzLnF1aWxsRWRpdG9yLFxuICAgICAgICBodG1sLFxuICAgICAgICBvbGREZWx0YSxcbiAgICAgICAgc291cmNlLFxuICAgICAgICB0ZXh0XG4gICAgICB9KVxuXG4gICAgICB0aGlzLmNkLm1hcmtGb3JDaGVjaygpXG4gICAgfSlcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtYXgtbGVuXG4gIGVkaXRvckNoYW5nZUhhbmRsZXIgPSAoXG4gICAgZXZlbnQ6ICd0ZXh0LWNoYW5nZScgfCAnc2VsZWN0aW9uLWNoYW5nZScsXG4gICAgY3VycmVudDogYW55IHwgUmFuZ2UgfCBudWxsLCBvbGQ6IGFueSB8IFJhbmdlIHwgbnVsbCwgc291cmNlOiBzdHJpbmdcbiAgKTogdm9pZCA9PiB7XG4gICAgLy8gb25seSBlbWl0IGNoYW5nZXMgd2hlbiB0aGVyZSdzIGFueSBsaXN0ZW5lclxuICAgIGlmICghdGhpcy5vbkVkaXRvckNoYW5nZWQub2JzZXJ2ZXJzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gb25seSBlbWl0IGNoYW5nZXMgZW1pdHRlZCBieSB1c2VyIGludGVyYWN0aW9uc1xuICAgIGlmIChldmVudCA9PT0gJ3RleHQtY2hhbmdlJykge1xuICAgICAgY29uc3QgdGV4dCA9IHRoaXMucXVpbGxFZGl0b3IuZ2V0VGV4dCgpXG4gICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5xdWlsbEVkaXRvci5nZXRDb250ZW50cygpXG5cbiAgICAgIGxldCBodG1sOiBzdHJpbmcgfCBudWxsID0gdGhpcy5lZGl0b3JFbGVtIS5xdWVyeVNlbGVjdG9yKCcucWwtZWRpdG9yJykhLmlubmVySFRNTFxuICAgICAgaWYgKGh0bWwgPT09ICc8cD48YnI+PC9wPicgfHwgaHRtbCA9PT0gJzxkaXY+PGJyPjwvZGl2PicpIHtcbiAgICAgICAgaHRtbCA9IHRoaXMuZGVmYXVsdEVtcHR5VmFsdWVcbiAgICAgIH1cblxuICAgICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMub25FZGl0b3JDaGFuZ2VkLmVtaXQoe1xuICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgICAgZGVsdGE6IGN1cnJlbnQsXG4gICAgICAgICAgZWRpdG9yOiB0aGlzLnF1aWxsRWRpdG9yLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgb2xkRGVsdGE6IG9sZCxcbiAgICAgICAgICBzb3VyY2UsXG4gICAgICAgICAgdGV4dFxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuY2QubWFya0ZvckNoZWNrKClcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLm9uRWRpdG9yQ2hhbmdlZC5lbWl0KHtcbiAgICAgICAgICBlZGl0b3I6IHRoaXMucXVpbGxFZGl0b3IsXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgb2xkUmFuZ2U6IG9sZCxcbiAgICAgICAgICByYW5nZTogY3VycmVudCxcbiAgICAgICAgICBzb3VyY2VcbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLmNkLm1hcmtGb3JDaGVjaygpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGlzcG9zZSgpXG5cbiAgICB0aGlzLnF1aWxsU3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpXG4gICAgdGhpcy5xdWlsbFN1YnNjcmlwdGlvbiA9IG51bGxcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMucXVpbGxFZGl0b3IpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvZG90LW5vdGF0aW9uICovXG4gICAgaWYgKGNoYW5nZXMucmVhZE9ubHkpIHtcbiAgICAgIHRoaXMucXVpbGxFZGl0b3IuZW5hYmxlKCFjaGFuZ2VzLnJlYWRPbmx5LmN1cnJlbnRWYWx1ZSlcbiAgICB9XG4gICAgaWYgKGNoYW5nZXMucGxhY2Vob2xkZXIpIHtcbiAgICAgIHRoaXMucXVpbGxFZGl0b3Iucm9vdC5kYXRhc2V0LnBsYWNlaG9sZGVyID1cbiAgICAgICAgY2hhbmdlcy5wbGFjZWhvbGRlci5jdXJyZW50VmFsdWVcbiAgICB9XG4gICAgaWYgKGNoYW5nZXMuZGVmYXVsdEVtcHR5VmFsdWUpIHtcbiAgICAgIHRoaXMucXVpbGxFZGl0b3Iucm9vdC5kYXRhc2V0LmRlZmF1bHRFbXB0eVZhbHVlID1cbiAgICAgICAgY2hhbmdlcy5kZWZhdWx0RW1wdHlWYWx1ZS5jdXJyZW50VmFsdWVcbiAgICB9XG4gICAgaWYgKGNoYW5nZXMuc3R5bGVzKSB7XG4gICAgICBjb25zdCBjdXJyZW50U3R5bGluZyA9IGNoYW5nZXMuc3R5bGVzLmN1cnJlbnRWYWx1ZVxuICAgICAgY29uc3QgcHJldmlvdXNTdHlsaW5nID0gY2hhbmdlcy5zdHlsZXMucHJldmlvdXNWYWx1ZVxuXG4gICAgICBpZiAocHJldmlvdXNTdHlsaW5nKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHByZXZpb3VzU3R5bGluZykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZVN0eWxlKHRoaXMuZWRpdG9yRWxlbSwga2V5KVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgaWYgKGN1cnJlbnRTdHlsaW5nKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGN1cnJlbnRTdHlsaW5nKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5lZGl0b3JFbGVtLCBrZXksIHRoaXMuc3R5bGVzW2tleV0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjaGFuZ2VzLmNsYXNzZXMpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRDbGFzc2VzID0gY2hhbmdlcy5jbGFzc2VzLmN1cnJlbnRWYWx1ZVxuICAgICAgY29uc3QgcHJldmlvdXNDbGFzc2VzID0gY2hhbmdlcy5jbGFzc2VzLnByZXZpb3VzVmFsdWVcblxuICAgICAgaWYgKHByZXZpb3VzQ2xhc3Nlcykge1xuICAgICAgICB0aGlzLnJlbW92ZUNsYXNzZXMocHJldmlvdXNDbGFzc2VzKVxuICAgICAgfVxuXG4gICAgICBpZiAoY3VycmVudENsYXNzZXMpIHtcbiAgICAgICAgdGhpcy5hZGRDbGFzc2VzKGN1cnJlbnRDbGFzc2VzKVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBXZSdkIHdhbnQgdG8gcmUtYXBwbHkgZXZlbnQgbGlzdGVuZXJzIGlmIHRoZSBgZGVib3VuY2VUaW1lYCBiaW5kaW5nIGNoYW5nZXMgdG8gYXBwbHkgdGhlXG4gICAgLy8gYGRlYm91bmNlVGltZWAgb3BlcmF0b3Igb3IgdmljZS12ZXJzYSByZW1vdmUgaXQuXG4gICAgaWYgKGNoYW5nZXMuZGVib3VuY2VUaW1lKSB7XG4gICAgICB0aGlzLmFkZFF1aWxsRXZlbnRMaXN0ZW5lcnMoKVxuICAgIH1cbiAgICAvKiBlc2xpbnQtZW5hYmxlIEB0eXBlc2NyaXB0LWVzbGludC9kb3Qtbm90YXRpb24gKi9cbiAgfVxuXG4gIGFkZENsYXNzZXMoY2xhc3NMaXN0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBRdWlsbEVkaXRvckJhc2Uubm9ybWFsaXplQ2xhc3NOYW1lcyhjbGFzc0xpc3QpLmZvckVhY2goKGM6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmVkaXRvckVsZW0sIGMpXG4gICAgfSlcbiAgfVxuXG4gIHJlbW92ZUNsYXNzZXMoY2xhc3NMaXN0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBRdWlsbEVkaXRvckJhc2Uubm9ybWFsaXplQ2xhc3NOYW1lcyhjbGFzc0xpc3QpLmZvckVhY2goKGM6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy5yZW5kZXJlci5yZW1vdmVDbGFzcyh0aGlzLmVkaXRvckVsZW0sIGMpXG4gICAgfSlcbiAgfVxuXG4gIHdyaXRlVmFsdWUoY3VycmVudFZhbHVlOiBhbnkpIHtcblxuICAgIC8vIG9wdGlvbmFsIGZpeCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMTQ5ODhcbiAgICBpZiAodGhpcy5maWx0ZXJOdWxsICYmIGN1cnJlbnRWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5jb250ZW50ID0gY3VycmVudFZhbHVlXG5cbiAgICBpZiAoIXRoaXMucXVpbGxFZGl0b3IpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGZvcm1hdCA9IGdldEZvcm1hdCh0aGlzLmZvcm1hdCwgdGhpcy5zZXJ2aWNlLmNvbmZpZy5mb3JtYXQpXG4gICAgY29uc3QgbmV3VmFsdWUgPSB0aGlzLnZhbHVlU2V0dGVyKHRoaXMucXVpbGxFZGl0b3IsIGN1cnJlbnRWYWx1ZSlcblxuICAgIGlmICh0aGlzLmNvbXBhcmVWYWx1ZXMpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRFZGl0b3JWYWx1ZSA9IHRoaXMucXVpbGxFZGl0b3IuZ2V0Q29udGVudHMoKVxuICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KGN1cnJlbnRFZGl0b3JWYWx1ZSkgPT09IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFZhbHVlKSB7XG4gICAgICBpZiAoZm9ybWF0ID09PSAndGV4dCcpIHtcbiAgICAgICAgdGhpcy5xdWlsbEVkaXRvci5zZXRUZXh0KGN1cnJlbnRWYWx1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucXVpbGxFZGl0b3Iuc2V0Q29udGVudHMobmV3VmFsdWUpXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5xdWlsbEVkaXRvci5zZXRUZXh0KCcnKVxuXG4gIH1cblxuICBzZXREaXNhYmxlZFN0YXRlKGlzRGlzYWJsZWQ6IGJvb2xlYW4gPSB0aGlzLmRpc2FibGVkKTogdm9pZCB7XG4gICAgLy8gc3RvcmUgaW5pdGlhbCB2YWx1ZSB0byBzZXQgYXBwcm9wcmlhdGUgZGlzYWJsZWQgc3RhdHVzIGFmdGVyIFZpZXdJbml0XG4gICAgdGhpcy5kaXNhYmxlZCA9IGlzRGlzYWJsZWRcbiAgICBpZiAodGhpcy5xdWlsbEVkaXRvcikge1xuICAgICAgaWYgKGlzRGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5xdWlsbEVkaXRvci5kaXNhYmxlKClcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBdHRyaWJ1dGUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdkaXNhYmxlZCcsICdkaXNhYmxlZCcpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXRoaXMucmVhZE9ubHkpIHtcbiAgICAgICAgICB0aGlzLnF1aWxsRWRpdG9yLmVuYWJsZSgpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdkaXNhYmxlZCcpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogKG1vZGVsVmFsdWU6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMub25Nb2RlbENoYW5nZSA9IGZuXG4gIH1cblxuICByZWdpc3Rlck9uVG91Y2hlZChmbjogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMub25Nb2RlbFRvdWNoZWQgPSBmblxuICB9XG5cbiAgcmVnaXN0ZXJPblZhbGlkYXRvckNoYW5nZShmbjogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMub25WYWxpZGF0b3JDaGFuZ2VkID0gZm5cbiAgfVxuXG4gIHZhbGlkYXRlKCkge1xuICAgIGlmICghdGhpcy5xdWlsbEVkaXRvcikge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBjb25zdCBlcnI6IHtcbiAgICAgIG1pbkxlbmd0aEVycm9yPzoge1xuICAgICAgICBnaXZlbjogbnVtYmVyXG4gICAgICAgIG1pbkxlbmd0aDogbnVtYmVyXG4gICAgICB9XG4gICAgICBtYXhMZW5ndGhFcnJvcj86IHtcbiAgICAgICAgZ2l2ZW46IG51bWJlclxuICAgICAgICBtYXhMZW5ndGg6IG51bWJlclxuICAgICAgfVxuICAgICAgcmVxdWlyZWRFcnJvcj86IHsgZW1wdHk6IGJvb2xlYW4gfVxuICAgIH0gPSB7fVxuICAgIGxldCB2YWxpZCA9IHRydWVcblxuICAgIGNvbnN0IHRleHQgPSB0aGlzLnF1aWxsRWRpdG9yLmdldFRleHQoKVxuICAgIC8vIHRyaW0gdGV4dCBpZiB3YW50ZWQgKyBoYW5kbGUgc3BlY2lhbCBjYXNlIHRoYXQgYW4gZW1wdHkgZWRpdG9yIGNvbnRhaW5zIGEgbmV3IGxpbmVcbiAgICBjb25zdCB0ZXh0TGVuZ3RoID0gdGhpcy50cmltT25WYWxpZGF0aW9uID8gdGV4dC50cmltKCkubGVuZ3RoIDogKHRleHQubGVuZ3RoID09PSAxICYmIHRleHQudHJpbSgpLmxlbmd0aCA9PT0gMCA/IDAgOiB0ZXh0Lmxlbmd0aCAtIDEpXG4gICAgY29uc3QgZGVsdGFPcGVyYXRpb25zID0gdGhpcy5xdWlsbEVkaXRvci5nZXRDb250ZW50cygpLm9wc1xuICAgIGNvbnN0IG9ubHlFbXB0eU9wZXJhdGlvbiA9IGRlbHRhT3BlcmF0aW9ucyAmJiBkZWx0YU9wZXJhdGlvbnMubGVuZ3RoID09PSAxICYmIFsnXFxuJywgJyddLmluY2x1ZGVzKGRlbHRhT3BlcmF0aW9uc1swXS5pbnNlcnQpXG5cbiAgICBpZiAodGhpcy5taW5MZW5ndGggJiYgdGV4dExlbmd0aCAmJiB0ZXh0TGVuZ3RoIDwgdGhpcy5taW5MZW5ndGgpIHtcbiAgICAgIGVyci5taW5MZW5ndGhFcnJvciA9IHtcbiAgICAgICAgZ2l2ZW46IHRleHRMZW5ndGgsXG4gICAgICAgIG1pbkxlbmd0aDogdGhpcy5taW5MZW5ndGhcbiAgICAgIH1cblxuICAgICAgdmFsaWQgPSBmYWxzZVxuICAgIH1cblxuICAgIGlmICh0aGlzLm1heExlbmd0aCAmJiB0ZXh0TGVuZ3RoID4gdGhpcy5tYXhMZW5ndGgpIHtcbiAgICAgIGVyci5tYXhMZW5ndGhFcnJvciA9IHtcbiAgICAgICAgZ2l2ZW46IHRleHRMZW5ndGgsXG4gICAgICAgIG1heExlbmd0aDogdGhpcy5tYXhMZW5ndGhcbiAgICAgIH1cblxuICAgICAgdmFsaWQgPSBmYWxzZVxuICAgIH1cblxuICAgIGlmICh0aGlzLnJlcXVpcmVkICYmICF0ZXh0TGVuZ3RoICYmIG9ubHlFbXB0eU9wZXJhdGlvbikge1xuICAgICAgZXJyLnJlcXVpcmVkRXJyb3IgPSB7XG4gICAgICAgIGVtcHR5OiB0cnVlXG4gICAgICB9XG5cbiAgICAgIHZhbGlkID0gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsaWQgPyBudWxsIDogZXJyXG4gIH1cblxuICBwcml2YXRlIGFkZFF1aWxsRXZlbnRMaXN0ZW5lcnMoKTogdm9pZCB7XG4gICAgdGhpcy5kaXNwb3NlKClcblxuICAgIC8vIFdlIGhhdmUgdG8gZW50ZXIgdGhlIGA8cm9vdD5gIHpvbmUgd2hlbiBhZGRpbmcgZXZlbnQgbGlzdGVuZXJzLCBzbyBgZGVib3VuY2VUaW1lYCB3aWxsIHNwYXduIHRoZVxuICAgIC8vIGBBc3luY0FjdGlvbmAgdGhlcmUgdy9vIHRyaWdnZXJpbmcgY2hhbmdlIGRldGVjdGlvbnMuIFdlIHN0aWxsIHJlLWVudGVyIHRoZSBBbmd1bGFyJ3Mgem9uZSB0aHJvdWdoXG4gICAgLy8gYHpvbmUucnVuYCB3aGVuIHdlIGVtaXQgYW4gZXZlbnQgdG8gdGhlIHBhcmVudCBjb21wb25lbnQuXG4gICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9uID0gbmV3IFN1YnNjcmlwdGlvbigpXG5cbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZChcbiAgICAgICAgLy8gbWFyayBtb2RlbCBhcyB0b3VjaGVkIGlmIGVkaXRvciBsb3N0IGZvY3VzXG4gICAgICAgIGZyb21FdmVudCh0aGlzLnF1aWxsRWRpdG9yLCAnc2VsZWN0aW9uLWNoYW5nZScpLnN1YnNjcmliZShcbiAgICAgICAgICAoW3JhbmdlLCBvbGRSYW5nZSwgc291cmNlXSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25DaGFuZ2VIYW5kbGVyKHJhbmdlIGFzIGFueSwgb2xkUmFuZ2UgYXMgYW55LCBzb3VyY2UpXG4gICAgICAgICAgfVxuICAgICAgICApXG4gICAgICApXG5cbiAgICAgIC8vIFRoZSBgZnJvbUV2ZW50YCBzdXBwb3J0cyBwYXNzaW5nIEpRdWVyeS1zdHlsZSBldmVudCB0YXJnZXRzLCB0aGUgZWRpdG9yIGhhcyBgb25gIGFuZCBgb2ZmYCBtZXRob2RzIHdoaWNoXG4gICAgICAvLyB3aWxsIGJlIGludm9rZWQgdXBvbiBzdWJzY3JpcHRpb24gYW5kIHRlYXJkb3duLlxuICAgICAgbGV0IHRleHRDaGFuZ2UkID0gZnJvbUV2ZW50KHRoaXMucXVpbGxFZGl0b3IsICd0ZXh0LWNoYW5nZScpXG4gICAgICBsZXQgZWRpdG9yQ2hhbmdlJCA9IGZyb21FdmVudCh0aGlzLnF1aWxsRWRpdG9yLCAnZWRpdG9yLWNoYW5nZScpXG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5kZWJvdW5jZVRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHRleHRDaGFuZ2UkID0gdGV4dENoYW5nZSQucGlwZShkZWJvdW5jZVRpbWUodGhpcy5kZWJvdW5jZVRpbWUpKVxuICAgICAgICBlZGl0b3JDaGFuZ2UkID0gZWRpdG9yQ2hhbmdlJC5waXBlKGRlYm91bmNlVGltZSh0aGlzLmRlYm91bmNlVGltZSkpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZChcbiAgICAgICAgLy8gdXBkYXRlIG1vZGVsIGlmIHRleHQgY2hhbmdlc1xuICAgICAgICB0ZXh0Q2hhbmdlJC5zdWJzY3JpYmUoKFtkZWx0YSwgb2xkRGVsdGEsIHNvdXJjZV0pID0+IHtcbiAgICAgICAgICB0aGlzLnRleHRDaGFuZ2VIYW5kbGVyKGRlbHRhIGFzIGFueSwgb2xkRGVsdGEgYXMgYW55LCBzb3VyY2UpXG4gICAgICAgIH0pXG4gICAgICApXG5cbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZChcbiAgICAgICAgLy8gdHJpZ2dlcmVkIGlmIHNlbGVjdGlvbiBvciB0ZXh0IGNoYW5nZWRcbiAgICAgICAgZWRpdG9yQ2hhbmdlJC5zdWJzY3JpYmUoKFtldmVudCwgY3VycmVudCwgb2xkLCBzb3VyY2VdKSA9PiB7XG4gICAgICAgICAgdGhpcy5lZGl0b3JDaGFuZ2VIYW5kbGVyKGV2ZW50IGFzICd0ZXh0LWNoYW5nZScgfCAnc2VsZWN0aW9uLWNoYW5nZScsIGN1cnJlbnQsIG9sZCwgc291cmNlKVxuICAgICAgICB9KVxuICAgICAgKVxuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9uICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpXG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbiA9IG51bGxcbiAgICB9XG4gIH1cbn1cblxuQENvbXBvbmVudCh7XG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIHByb3ZpZGVyczogW1xuICAgIHtcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgcHJvdmlkZTogTkdfVkFMVUVfQUNDRVNTT1IsXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBRdWlsbEVkaXRvckNvbXBvbmVudClcbiAgICB9LFxuICAgIHtcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgcHJvdmlkZTogTkdfVkFMSURBVE9SUyxcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICAgIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IFF1aWxsRWRpdG9yQ29tcG9uZW50KVxuICAgIH1cbiAgXSxcbiAgc2VsZWN0b3I6ICdxdWlsbC1lZGl0b3InLFxuICB0ZW1wbGF0ZTogYFxuICA8bmctY29udGVudCBzZWxlY3Q9XCJbcXVpbGwtZWRpdG9yLXRvb2xiYXJdXCI+PC9uZy1jb250ZW50PlxuYCxcbiAgc3R5bGVzOiBbXG4gICAgYFxuICAgIDpob3N0IHtcbiAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICB9XG4gICAgYFxuICBdXG59KVxuZXhwb3J0IGNsYXNzIFF1aWxsRWRpdG9yQ29tcG9uZW50IGV4dGVuZHMgUXVpbGxFZGl0b3JCYXNlIHtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsXG4gICAgQEluamVjdChFbGVtZW50UmVmKSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIEBJbmplY3QoQ2hhbmdlRGV0ZWN0b3JSZWYpIGNkOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBASW5qZWN0KERvbVNhbml0aXplcikgZG9tU2FuaXRpemVyOiBEb21TYW5pdGl6ZXIsXG4gICAgQEluamVjdChQTEFURk9STV9JRCkgcGxhdGZvcm1JZDogYW55LFxuICAgIEBJbmplY3QoUmVuZGVyZXIyKSByZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgIEBJbmplY3QoTmdab25lKSB6b25lOiBOZ1pvbmUsXG4gICAgQEluamVjdChRdWlsbFNlcnZpY2UpIHNlcnZpY2U6IFF1aWxsU2VydmljZVxuICApIHtcbiAgICBzdXBlcihcbiAgICAgIGluamVjdG9yLFxuICAgICAgZWxlbWVudFJlZixcbiAgICAgIGNkLFxuICAgICAgZG9tU2FuaXRpemVyLFxuICAgICAgcGxhdGZvcm1JZCxcbiAgICAgIHJlbmRlcmVyLFxuICAgICAgem9uZSxcbiAgICAgIHNlcnZpY2VcbiAgICApXG4gIH1cblxufVxuIl19