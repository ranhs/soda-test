//
// Since TestBed cannot be loaded in Node, and soda-test need to work in Node and Angular,
// we only import / export the interfaces from angular/core
// we redefine all the types that are defined as classes in angular/core as interfaces
// so we can export them instead of the classes (that cannot be loaded if you are in node)
//

import { TestModuleMetadata, MetadataOverride, TestEnvironmentOptions } from '@angular/core/testing'
export { TestModuleMetadata, MetadataOverride, TestEnvironmentOptions } from '@angular/core/testing'
import { Predicate, ProviderToken, BootstrapOptions, CompilerOptions, Provider, ModuleWithProviders, SchemaMetadata, ComponentDecorator, TypeDecorator} from '@angular/core'
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

interface AngularCore {
    Component: ComponentDecorator
}

function Component(obj: unknown): TypeDecorator {
    if ( AngularCore ) {
        return AngularCore.Component(obj)
    }
    return ()=>{};
}

function getAngularCore(): AngularCore {
    // @angular/core is the only libraray the exports "Component"
    for ( let key of Object.keys(require.cache) ) {
        if ( require.cache[key].exports.Component ) {
            return require.cache[key].exports
        }
    }
    return null
}

export const TestBed = getTestBed()
const AngularCore = getAngularCore()

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

export interface FixtureOptions {
    declarations?: any[]
    imports?: any[]
}

export function fixture<T>(component: Type<T>, options?: FixtureOptions): argumentDecorator {
    return (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void => {
        getInfo(target).addSinon(propertyKey as string, parameterIndex, {
            caller: null,
            target: { component, options },
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

const componentTestInfo = {
    selector: `host-component`,
    template: '' // shall be set before use
}

@Component(componentTestInfo)
class TestHostComponent {
}

function getSelector<T>(component: Type<T>): string {
    if ( !component ) return null
    const annotations = component['__annotations__']
    if (!annotations || !Array.isArray(annotations) || annotations.length === 0) return null
    return annotations[0]?.selector
}

function getModuleDef<T>(component: Type<T>, options: FixtureOptions): TestModuleMetadata {
    const moduleDef: TestModuleMetadata = {
        declarations: options?.declarations ?? [],
        imports: options?.imports
    }
    if ( moduleDef.declarations.indexOf(component) < 0 )
        moduleDef.declarations.push(component)
    moduleDef.declarations.push(TestHostComponent)
    return moduleDef
}

class SodaFixtureWrapper<T> implements SodaFixture<T> {
    constructor(private fixtureWrapper: ComponentFixture<TestHostComponent>, selector: string) {
        if ( !By ) By = RetriveByMethod()
        this.ngZone = fixtureWrapper.ngZone
        this.debugElement = fixtureWrapper.debugElement.query(By.css(selector)) as never
        this.componentInstance = this.debugElement.componentInstance
        this.nativeElement = this.debugElement.nativeElement
    }

    ngZone: NgZone | null
    debugElement: SodaDebugElement
    componentInstance: T
    nativeElement: any
    detectChanges(checkNoChanges?: boolean): void {
        this.fixtureWrapper.detectChanges(checkNoChanges)
    }
    checkNoChanges(): void {
        this.fixtureWrapper.checkNoChanges()
    }
    autoDetectChanges(autoDetect?: boolean): void {
        this.fixtureWrapper.autoDetectChanges(autoDetect)
    }
    isStable(): boolean {
        return this.fixtureWrapper.isStable()
    }
    whenStable(): Promise<any> {
        return this.fixtureWrapper.whenStable()
    }
    whenRenderingDone(): Promise<any> {
        return this.fixtureWrapper.whenRenderingDone()
    }
    destroy(): void {
        this.fixtureWrapper.destroy()
    }
    queryByCss<E1 = CommonEvents>(selector: string): SodaDebugElement<E1> {
        return this.debugElement.query.by.css<E1>(selector)
    }
}

let lastCreatedFixture: SodaFixture<unknown>
let lastComponentType: Type<unknown>

export function createFixture<T>(component: Type<T>, options: FixtureOptions): SodaFixture<T> {
    if ( TestBed ) {
        TestBed.configureTestingModule(getModuleDef(component, options))
        const selector = getSelector(component)
        if (!selector) throw new Error(`cannot create Fixture for type ${component.name}`)
        componentTestInfo.template = `<${selector}></${selector}>`
        const outerfixture = TestBed.createComponent(TestHostComponent)
        const fixture: SodaFixture<T> = new SodaFixtureWrapper<T>(outerfixture, selector)
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
    directive(type: Type<any>): Predicate<DebugNode<DebugElement>>
    all(): Predicate<DebugNode<DebugElement>>
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

const eventNames: string[] = ['click', 'input', 'ngModelChange']

export function addEvents(...names: string[]) {
    for (const eventName of names) {
        if ( eventNames.indexOf(eventName) < 0 ) {
            eventNames.push(eventName)
        }
    }
}

function fillFixtureMethods<T, DET>(fixture: ComponentFixture<T, DET>): void {
    // fill debugElement methods
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

        Object.defineProperty(DebugElementPrototype, 'text', {
            get: function(): string {
                return this.nativeElement.innerText
            },
            set: function(value: string): void {
                this.nativeElement.innerText = value
                this.triggerEventHandler.ngModelChange(value)
            }
        })
    }

    const triggerEventHandlerDescriptor = Object.getOwnPropertyDescriptor(DebugElementPrototype, 'triggerEventHandler')
    if ( !triggerEventHandlerDescriptor.get ) {
        const _triggerEventHandler = DebugElementPrototype.triggerEventHandler
        Object.defineProperty(DebugElementPrototype, 'triggerEventHandler', {
            get: function() {
                for ( const eventName of eventNames ) {
                    _triggerEventHandler[eventName] = (objEvent: any) => {
                        this.triggerEventHandler(eventName, objEvent)
                    }
                }
                return _triggerEventHandler
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


export interface ComponentFixture<T, DET = DebugElement> {
    //componentRef: ComponentRef<T>
    ngZone: NgZone | null
    debugElement: DET
    componentInstance: T
    nativeElement: any
    //elementRef: ElementRef
    //changeDetectorRef: ChangeDetectorRef
    detectChanges(checkNoChanges?: boolean): void
    checkNoChanges(): void
    autoDetectChanges(autoDetect?: boolean): void
    isStable(): boolean
    whenStable(): Promise<any>
    whenRenderingDone(): Promise<any>
    destroy(): void
}

export interface CommonEvents {
    click(eventObj?: PointerEvent): void
    input(eventObj?: InputEvent): void
    ngModelChange(text: string): void
}

export interface SodaFixture<T, E = CommonEvents> extends ComponentFixture<T, SodaDebugElement<E>>
{
    queryByCss<E1=E>(selector: string): SodaDebugElement<E1>   
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

interface DebugElementBase<DET> extends DebugNode<DET> {
    get nativeElement(): HTMLElement
    get name(): string
    get properties(): { [key: string]: any }
    get attributes(): { [key: string]: string | null }
    get styles(): { [key: string]: string | null }
    get classes(): { [key: string]: boolean }
    get childNodes(): DebugNode<DET>[]
    get children(): DET[]

}

export interface DebugElement extends DebugElementBase<DebugElement> {
    query(predicate: Predicate<DebugElement>): DebugElement
    queryAll(predicate: Predicate<DebugElement>): DebugElement[]
    queryAllNodes(predicate: Predicate<DebugNode<DebugElement>>): DebugNode<DebugElement>[]
    triggerEventHandler(eventName: string, eventObj?: any): void
}

export interface SodaDebugElement<E = CommonEvents> extends DebugElementBase<SodaDebugElement> {
    text: string
    query: { by : { css<E1=E>(selector: string): SodaDebugElement<E1> } }
    queryAll: { by : { css<E1=E>(selector: string): SodaDebugElement<E1>[] } }
    queryAllNodes: {by : {
        directive<E1=E>(type: Type<any>): DebugNode<SodaDebugElement<E1>>[],
        all<E1=E>(): DebugNode<SodaDebugElement<E1>>[]
    }}
    triggerEventHandler: E
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

export interface DebugNode<DET> {
    readonly nativeNode: any
    get parent(): DET | null
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
