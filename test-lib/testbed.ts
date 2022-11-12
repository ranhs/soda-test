//
// Since TestBed cannot be loaded in Node, and soda-test need to work in Node and Angular,
// we only import / export the interfaces from angular/core
// we redefine all the types that are defined as classes in angular/core as interfaces
// so we can export them instead of the classes (that cannot be loaded if you are in node)
//

import { TestModuleMetadata, MetadataOverride, TestEnvironmentOptions } from '@angular/core/testing'
export { TestModuleMetadata, MetadataOverride, TestEnvironmentOptions } from '@angular/core/testing'
import { Predicate, ProviderToken, BootstrapOptions, CompilerOptions, Provider, ModuleWithProviders, SchemaMetadata} from '@angular/core'
export { Predicate, ProviderToken, BootstrapOptions, CompilerOptions, Provider, ModuleWithProviders, SchemaMetadata} from '@angular/core'
import { EventEmitter } from 'events'
import { targetType } from './executables'
import { argumentDecorator } from '.'
import { getInfo, SinonKind } from './testInfo'

function getTestBed(): TestBedInterface {
    let _angular_core_testing : { getTestBed: () => TestBedInterface }
    // @angular/core/testing is the only libraray the exports "getTestBed"
    for ( let key of Object.keys(require.cache) ) {
        let getTestBed = require.cache[key].exports.getTestBed
        if ( getTestBed ) {
            return getTestBed()
        }
    }
}

export const TestBed = getTestBed()

export function getInitTestBedFunction(): () => void {
    /*
    if ( TestBed ) {
        const _testing = require('@angular/platform-browser-dynamic/testing')

        return function(): void {
            TestBed.initTestEnvironment(_testing.BrowserDynamicTestingModule, _testing.platformBrowserDynamicTesting())
        }
    }
    */
   return null
}

export function fixture<T>(component: Type<T>): argumentDecorator {
    return (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void => {
        getInfo(target).addSinon(propertyKey as string, parameterIndex, {
            caller: null,
            target: component,
            method: null,
            memberMethod: null,
            kind: SinonKind.Fixture,
            context: null
        })
    }
}

export function component<T>(component: Type<T>): argumentDecorator {
    return (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void => {
        getInfo(target).addSinon(propertyKey as string, parameterIndex, {
            caller: null,
            target: component,
            method: null,
            memberMethod: null,
            kind: SinonKind.Component,
            context: null
        })
    }
}

let lastCreatedFixture: ComponentFixture<unknown>
let lastComponentType: Type<unknown>

export function createFixture<T>(component: Type<T>): ComponentFixture<T> {
    if ( TestBed ) {
        let fixture = TestBed.createComponent(component)
        lastCreatedFixture = fixture
        lastComponentType = component
        fillFixtureMethods(fixture)
        fixture['restore'] = () => {
            if ( lastCreatedFixture === fixture ) {
                lastCreatedFixture = null
                lastComponentType = null
            }
        }
        fixture.detectChanges()
        return fixture
    }
}

interface ByInterface {
    css(selector: string): Predicate<DebugElement>
    directive(type: Type<any>): Predicate<DebugNode>
    all(): Predicate<DebugNode>
}

let By: ByInterface = null

function RetriveByMethod(): ByInterface {
    for ( const libName in require.cache ) {
        const lib = require.cache[libName]
        if ( lib.exports.By && lib.exports.By.css && lib.exports.By.directive) {
            return lib.exports.By
        }
    }
}

function fillFixtureMethods<T>(fixture: ComponentFixture<T>): void {
    const DebugElementPrototype = Object.getPrototypeOf(fixture.debugElement)
    if ( !DebugElementPrototype.query.by )
    {
        if ( !By ) By = RetriveByMethod()
        const _query = DebugElementPrototype.query

        Object.defineProperty(DebugElementPrototype, 'query', {
            get: function() {
                _query.by = {
                    css: (selector: string) => {
                        return this.query(By.css(selector))
                    }
                }
                return _query;
            }
        })

        const _queryAll = DebugElementPrototype.queryAll
        Object.defineProperty(DebugElementPrototype, 'queryAll', {
            get: function() {
                _queryAll.by = {
                    css: (selector: string) => {
                        return this.queryAll(By.css(selector))
                    }
                }
                return _queryAll
            }
        })

        const _queryAllNodes = DebugElementPrototype.queryAllNodes
        Object.defineProperty(DebugElementPrototype, 'queryAllNodes', {
            get: function() {
                _queryAllNodes.by = {
                    all: () => {
                        return this.queryAllNodes(By.all())
                    },
                    directive: (type: Type<any>) => {
                        return this.queryAllNodes(By.directive(type))
                    }
                }
                return _queryAllNodes
            }
        })
    }
}

export function createComponent<T>(component: Type<T>): T {
    if ( TestBed ) {
        let fixture: ComponentFixture<T>
        if ( lastComponentType === component ) {
            // using existing fixture
            fixture = lastCreatedFixture as never
        } else {
            // creating temporaray fixture
            fixture = TestBed.createComponent(component)
        }
        return fixture.componentInstance
    }
}

export interface TestBedInterface {
    get platform(): PlatformRef
    get ngModule(): Type<any> | Type<any>[]
    initTestEnvironment(ngModule: Type<any> | Type<any>[], platform: PlatformRef, options?: TestEnvironmentOptions): void
    resetTestEnvironment(): void
    resetTestingModule(): TestBedInterface
    configureCompiler(config: {
        providers?: any[]
        useJit?: boolean
    }): void
    configureTestingModule(moduleDef: TestModuleMetadata): TestBedInterface
    compileComponents(): Promise<any>
    inject<T>(token: ProviderToken<T>, notFoundValue?: T, flags?: InjectFlags): T
    inject<T>(token: ProviderToken<T>, notFoundValue: null, flags?: InjectFlags): T | null
    /** @deprecated from v9.0.0 use TestBed.inject */
    get<T>(token: ProviderToken<T>, notFoundValue?: T, flags?: InjectFlags): any
    /** @deprecated from v9.0.0 use TestBed.inject */
    get(token: any, notFoundValue?: any): any
    execute(tokens: any[], fn: Function, context?: any): any
    overrideModule(ngModule: Type<any>, override: MetadataOverride<NgModule>): TestBedInterface
    overrideComponent(component: Type<any>, override: MetadataOverride<Component>): TestBedInterface
    overrideDirective(directive: Type<any>, override: MetadataOverride<Directive>): TestBedInterface
    overridePipe(pipe: Type<any>, override: MetadataOverride<Pipe>): TestBedInterface
    overrideTemplate(component: Type<any>, template: string): TestBedInterface
    overrideProvider(token: any, provider: {
        useFactory: Function;
        deps: any[];
    }): TestBedInterface
    overrideProvider(token: any, provider: {
        useValue: any
    }): TestBedInterface
    overrideProvider(token: any, provider: {
        useFactory?: Function
        useValue?: any
        deps?: any[]
    }): TestBedInterface
    overrideTemplateUsingTestingModule(component: Type<any>, template: string): TestBedInterface
    createComponent<T>(component: Type<T>): ComponentFixture<T>
}


export interface ComponentFixture<T> {
    componentRef: ComponentRef<T>
    ngZone: NgZone | null
    debugElement: DebugElement
    componentInstance: T
    nativeElement: any
    elementRef: ElementRef
    changeDetectorRef: ChangeDetectorRef
    detectChanges(checkNoChanges?: boolean): void
    checkNoChanges(): void
    autoDetectChanges(autoDetect?: boolean): void
    isStable(): boolean
    whenStable(): Promise<any>
    whenRenderingDone(): Promise<any>
    destroy(): void
}

export interface ComponentRef<C> {
    setInput(name: string, value: unknown): void
    get location(): ElementRef
    get injector(): Injector
    get instance(): C
    get hostView(): ViewRef
    get changeDetectorRef(): ChangeDetectorRef
    get componentType(): Type<any>
    destroy(): void
    onDestroy(callback: Function): void
}

export interface NgZone {
    readonly hasPendingMacrotasks: boolean
    readonly hasPendingMicrotasks: boolean
    readonly isStable: boolean
    readonly onUnstable: EventEmitter
    readonly onMicrotaskEmpty: EventEmitter
    readonly onStable: EventEmitter
    readonly onError: EventEmitter
    run<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T;
    runTask<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T;
    runGuarded<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T;
    runOutsideAngular<T>(fn: (...args: any[]) => T): T;
}

export interface DebugElement extends DebugNode {
    get nativeElement(): HTMLElement
    get name(): string
    get properties(): { [key: string]: any }
    get attributes(): { [key: string]: string | null }
    get styles(): { [key: string]: string | null }
    get classes(): { [key: string]: boolean }
    get childNodes(): DebugNode[]
    get children(): DebugElement[]
    query: {
        (predicate: Predicate<DebugElement>): DebugElement,
        by: {css(selector: string): DebugElement}
    }
    queryAll: {
        (predicate: Predicate<DebugElement>): DebugElement[],
        by: {css(selector: string): DebugElement[]}
    }
    queryAllNodes: {
        (predicate: Predicate<DebugNode>): DebugNode[],
        by: {
            directive(type: Type<any>): DebugNode[],
            all(): DebugNode[]        
        }
    }
    triggerEventHandler(eventName: string, eventObj?: any): void
}

export interface QueryBy<T> {
    css(selector: string): T
    directive(type: Type<any>): T
}

export interface ElementRef<T = any> {
    nativeElement: T
}

export interface ChangeDetectorRef {
    markForCheck(): void
    detach(): void
    detectChanges(): void
    checkNoChanges(): void
    reattach(): void
}

export interface Injector {
    get<T>(token: ProviderToken<T>, notFoundValue?: T, flags?: InjectFlags): T
    get(token: any, notFoundValue?: any): any
}

export interface ViewRef extends ChangeDetectorRef {
    destroy(): void
    get destroyed(): boolean
    onDestroy(callback: Function): any
}

export interface DebugNode {
    readonly nativeNode: any
    get parent(): DebugElement | null
    get injector(): Injector;
    get componentInstance(): any
    get context(): any
    get listeners(): DebugEventListener[]
    get references(): { [key: string]: any }
    get providerTokens(): any[]
}

export interface DebugEventListener {
    name: string
    callback: Function
}

export interface Type<T> extends Function {
    new (...args: any[]): T;
}

export enum InjectFlags {
    Default = 0,
    Host = 1,
    Self = 2,
    SkipSelf = 4,
    Optional = 8
}

export interface PlatformRef {
    bootstrapModuleFactory<M>(moduleFactory: NgModuleFactory<M>, options?: BootstrapOptions): Promise<NgModuleRef<M>>;
    bootstrapModule<M>(moduleType: Type<M>, compilerOptions?: (CompilerOptions & BootstrapOptions) | Array<CompilerOptions & BootstrapOptions>): Promise<NgModuleRef<M>>;
    onDestroy(callback: () => void): void;
    get injector(): Injector;
    destroy(): void;
    get destroyed(): boolean;
}

export interface NgModuleFactory<T> {
    get moduleType(): Type<T>;
    create(parentInjector: Injector | null): NgModuleRef<T>;
}

export interface NgModuleRef<T> {
    get injector(): EnvironmentInjector;
    get componentFactoryResolver(): ComponentFactoryResolver;
    get instance(): T;
    destroy(): void;
    onDestroy(callback: () => void): void;
}

export interface EnvironmentInjector extends Injector {
    get<T>(token: ProviderToken<T>, notFoundValue?: T, flags?: InjectFlags): T;
    get(token: any, notFoundValue?: any): any;
    runInContext<ReturnT>(fn: () => ReturnT): ReturnT;
    destroy(): void;
}

export interface ComponentFactoryResolver {
    resolveComponentFactory<T>(component: Type<T>): ComponentFactory<T>;
}

export interface ComponentFactory<C> {
    get selector(): string
    componentType(): Type<any>
    get ngContentSelectors(): string[]
    get inputs(): {
        propName: string
        templateName: string
    }[]
    get outputs(): {
        propName: string
        templateName: string
    }[]
    create(injector: Injector, projectableNodes?: any[][], rootSelectorOrNode?: string | any, environmentInjector?: EnvironmentInjector | NgModuleRef<any>): ComponentRef<C>
}

export interface NgModule {
    providers?: Provider[];
    declarations?: Array<Type<any> | any[]>;
    imports?: Array<Type<any> | ModuleWithProviders<{}> | any[]>;
    exports?: Array<Type<any> | any[]>;
    entryComponents?: Array<Type<any> | any[]>;
    bootstrap?: Array<Type<any> | any[]>;
    schemas?: Array<SchemaMetadata | any[]>;
    id?: string;
    jit?: true;
}

export interface Component extends Directive {
    changeDetection?: ChangeDetectionStrategy;
    viewProviders?: Provider[];
    moduleId?: string;
    templateUrl?: string;
    template?: string;
    styleUrls?: string[];
    styles?: string[];
    animations?: any[];
    encapsulation?: ViewEncapsulation;
    interpolation?: [string, string];
    entryComponents?: Array<Type<any> | any[]>;
    preserveWhitespaces?: boolean;
    standalone?: boolean;
    imports?: (Type<any> | any[])[];
    schemas?: SchemaMetadata[];
}

export interface Directive {
    selector?: string
    inputs?: string[]
    outputs?: string[]
    providers?: Provider[]
    exportAs?: string
    queries?: { [key: string]: any }
    host?: { [key: string]: string }
    jit?: true
    standalone?: boolean
}

export interface Pipe {
    name: string
    pure?: boolean
    standalone?: boolean
}

export enum ChangeDetectionStrategy {
    OnPush = 0,
    Default = 1
}

export enum ViewEncapsulation {
    Emulated = 0,
    None = 2,
    ShadowDom = 3
}
