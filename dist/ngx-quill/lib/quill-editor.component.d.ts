import { DomSanitizer } from '@angular/platform-browser';
import { QuillModules, CustomOption, CustomModule } from './quill-editor.interfaces';
import QuillType, { Delta } from 'quill';
import { AfterViewInit, ChangeDetectorRef, ElementRef, EventEmitter, Injector, NgZone, OnChanges, OnDestroy, Renderer2, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, Validator } from '@angular/forms';
import { QuillService } from './quill.service';
import * as i0 from "@angular/core";
export interface Range {
    index: number;
    length: number;
}
export interface ContentChange {
    content: any;
    delta: Delta;
    editor: QuillType;
    html: string | null;
    oldDelta: Delta;
    source: string;
    text: string;
}
export interface SelectionChange {
    editor: QuillType;
    oldRange: Range | null;
    range: Range | null;
    source: string;
}
export interface Blur {
    editor: QuillType;
    source: string;
}
export interface Focus {
    editor: QuillType;
    source: string;
}
export declare type EditorChangeContent = ContentChange & {
    event: 'text-change';
};
export declare type EditorChangeSelection = SelectionChange & {
    event: 'selection-change';
};
export declare abstract class QuillEditorBase implements AfterViewInit, ControlValueAccessor, OnChanges, OnDestroy, Validator {
    elementRef: ElementRef;
    protected cd: ChangeDetectorRef;
    protected domSanitizer: DomSanitizer;
    protected platformId: any;
    protected renderer: Renderer2;
    protected zone: NgZone;
    protected service: QuillService;
    format?: 'object' | 'html' | 'text' | 'json';
    theme?: string;
    modules?: QuillModules;
    debug?: 'warn' | 'log' | 'error' | false;
    readOnly?: boolean;
    placeholder?: string;
    maxLength?: number;
    minLength?: number;
    required: boolean;
    formats?: string[] | null;
    customToolbarPosition: 'top' | 'bottom';
    sanitize?: boolean;
    styles: any;
    strict: boolean;
    scrollingContainer?: HTMLElement | string | null;
    bounds?: HTMLElement | string;
    customOptions: CustomOption[];
    customModules: CustomModule[];
    trackChanges?: 'user' | 'all';
    preserveWhitespace: boolean;
    classes?: string;
    trimOnValidation: boolean;
    linkPlaceholder?: string;
    compareValues: boolean;
    filterNull: boolean;
    debounceTime?: number;
    defaultEmptyValue?: any;
    onEditorCreated: EventEmitter<any>;
    onEditorChanged: EventEmitter<EditorChangeContent | EditorChangeSelection>;
    onContentChanged: EventEmitter<ContentChange>;
    onSelectionChanged: EventEmitter<SelectionChange>;
    onFocus: EventEmitter<Focus>;
    onBlur: EventEmitter<Blur>;
    quillEditor: QuillType;
    editorElem: HTMLElement;
    content: any;
    disabled: boolean;
    onModelChange: (modelValue?: any) => void;
    onModelTouched: () => void;
    onValidatorChanged: () => void;
    private document;
    private subscription;
    private quillSubscription;
    constructor(injector: Injector, elementRef: ElementRef, cd: ChangeDetectorRef, domSanitizer: DomSanitizer, platformId: any, renderer: Renderer2, zone: NgZone, service: QuillService);
    static normalizeClassNames(classes: string): string[];
    valueGetter: (quillEditor: QuillType, editorElement: HTMLElement) => string | any;
    valueSetter: (quillEditor: QuillType, value: any) => any;
    ngAfterViewInit(): void;
    selectionChangeHandler: (range: Range | null, oldRange: Range | null, source: string) => void;
    textChangeHandler: (delta: Delta, oldDelta: Delta, source: string) => void;
    editorChangeHandler: (event: 'text-change' | 'selection-change', current: any | Range | null, old: any | Range | null, source: string) => void;
    ngOnDestroy(): void;
    ngOnChanges(changes: SimpleChanges): void;
    addClasses(classList: string): void;
    removeClasses(classList: string): void;
    writeValue(currentValue: any): void;
    setDisabledState(isDisabled?: boolean): void;
    registerOnChange(fn: (modelValue: any) => void): void;
    registerOnTouched(fn: () => void): void;
    registerOnValidatorChange(fn: () => void): void;
    validate(): {
        minLengthError?: {
            given: number;
            minLength: number;
        };
        maxLengthError?: {
            given: number;
            maxLength: number;
        };
        requiredError?: {
            empty: boolean;
        };
    };
    private addQuillEventListeners;
    private dispose;
    static ɵfac: i0.ɵɵFactoryDeclaration<QuillEditorBase, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QuillEditorBase, never, never, { "format": "format"; "theme": "theme"; "modules": "modules"; "debug": "debug"; "readOnly": "readOnly"; "placeholder": "placeholder"; "maxLength": "maxLength"; "minLength": "minLength"; "required": "required"; "formats": "formats"; "customToolbarPosition": "customToolbarPosition"; "sanitize": "sanitize"; "styles": "styles"; "strict": "strict"; "scrollingContainer": "scrollingContainer"; "bounds": "bounds"; "customOptions": "customOptions"; "customModules": "customModules"; "trackChanges": "trackChanges"; "preserveWhitespace": "preserveWhitespace"; "classes": "classes"; "trimOnValidation": "trimOnValidation"; "linkPlaceholder": "linkPlaceholder"; "compareValues": "compareValues"; "filterNull": "filterNull"; "debounceTime": "debounceTime"; "defaultEmptyValue": "defaultEmptyValue"; "valueGetter": "valueGetter"; "valueSetter": "valueSetter"; }, { "onEditorCreated": "onEditorCreated"; "onEditorChanged": "onEditorChanged"; "onContentChanged": "onContentChanged"; "onSelectionChanged": "onSelectionChanged"; "onFocus": "onFocus"; "onBlur": "onBlur"; }, never>;
}
export declare class QuillEditorComponent extends QuillEditorBase {
    constructor(injector: Injector, elementRef: ElementRef, cd: ChangeDetectorRef, domSanitizer: DomSanitizer, platformId: any, renderer: Renderer2, zone: NgZone, service: QuillService);
    static ɵfac: i0.ɵɵFactoryDeclaration<QuillEditorComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<QuillEditorComponent, "quill-editor", never, {}, {}, never, ["[quill-editor-toolbar]"]>;
}
