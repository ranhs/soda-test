//
// Since TestBed cannot be loaded in Node, and soda-test need to work in Node and Angular,
// we redefine all the types.
// types that were defined as classes in angular/core we redefine as interfaces
//

import { EventEmitter } from 'events'
import { targetType } from './executables'
import { argumentDecorator } from '.'
import { getInfo, SinonKind } from './testInfo'

function getTestBed(): TestBedInterface {
    // @angular/core/testing is the only libraray the exports "getTestBed"
    for ( const key of Object.keys(require.cache) ) {
        const getTestBed = require.cache[key].exports.getTestBed
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
    return ()=>{/*not supported*/};
}

function getAngularCore(): AngularCore {
    // @angular/core is the only libraray the exports "Component"
    for ( const key of Object.keys(require.cache) ) {
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
    declarations?: unknown[]
    imports?: unknown[]
    inputs?: string[]
    outputs?: string[]
    events?: string[]
}

export function fixture<T>(component: Type<T>, options?: FixtureOptions): argumentDecorator {
    return (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void => {
        if (options?.events) {
            addEvents(...options.events)
        }
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


interface TestHostAPI {
    inputs: {[key: string]: unknown}
    events: EventEmitter
    eventCalled(name: string, data: unknown): void
}

function getSelector<T>(component: Type<T>): string {
    if ( !component ) return null
    const annotations = component['__annotations__']
    if (!annotations || !Array.isArray(annotations) || annotations.length === 0) return null
    return annotations[0]?.selector
}

function getModuleDef<T, TestHostComponent>(component: Type<T>, options: FixtureOptions, thc: Type<TestHostComponent>): TestModuleMetadata {
    const moduleDef: TestModuleMetadata = {
        declarations: options?.declarations ?? [],
        imports: options?.imports
    }
    if ( moduleDef.declarations.indexOf(component) < 0 )
        moduleDef.declarations.push(component)
    moduleDef.declarations.push(thc)
    return moduleDef
}

type ANY = any // eslint-disable-line @typescript-eslint/no-explicit-any
type AFunction = Function // eslint-disable-line @typescript-eslint/ban-types
type AnObject = Object // eslint-disable-line @typescript-eslint/ban-types

class SodaFixtureWrapper<T> implements SodaFixture<T> {
    constructor(private fixtureWrapper: ComponentFixture<TestHostAPI>, selector: string) {
        if ( !By ) By = RetriveByMethod()
        this.ngZone = fixtureWrapper.ngZone
        this.debugElement = fixtureWrapper.debugElement.query(By.css(selector)) as never
        this.componentInstance = this.debugElement.componentInstance
        this.nativeElement = this.debugElement.nativeElement
    }

    ngZone: NgZone | null
    debugElement: SodaDebugElement
    componentInstance: T
    nativeElement: ANY
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
    whenStable(): Promise<ANY> { 
        return this.fixtureWrapper.whenStable()
    }
    whenRenderingDone(): Promise<ANY> {
        return this.fixtureWrapper.whenRenderingDone()
    }
    destroy(): void {
        this.fixtureWrapper.destroy()
    }
    queryByCss<E1 = CommonEvents>(selector: string): SodaDebugElement<E1> {
        return this.debugElement.query.by.css<E1>(selector)
    }
    get inputs(): {[key: string]: unknown} { 
        return this.fixtureWrapper.componentInstance.inputs
    }
    get events(): EventEmitter {
        return this.fixtureWrapper.componentInstance.events
    }
}

let lastCreatedFixture: SodaFixture<unknown>
let lastComponentType: Type<unknown>

export function createFixture<T>(component: Type<T>, options: FixtureOptions): SodaFixture<T> {
    if ( TestBed ) {
        const selector = getSelector(component)
        if (!selector) throw new Error(`cannot create Fixture for type ${component.name}`)
        let TestHostComponent = class TestHostComponent {
            inputs: {[key: string]: unknown} = {}
            events = new EventEmitter();
            eventCalled(name: string, data: unknown): void {
                this.events.emit(name, data)
            }
        }
        TestHostComponent = Reflect.decorate([
            Component({
                selector: `host-component`,
                template: createTemplate(selector, options)
            })
        ], TestHostComponent) as never
        TestBed.configureTestingModule(getModuleDef(component, options, TestHostComponent))
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

function createTemplate(selector: string, options: FixtureOptions): string {
    let template = `<${selector}`
    if (options) {
        if (options.inputs) {
            for (const input of options.inputs) {
                template += ` [${input}]="inputs['${input}']"`
            }
        }
        if (options.outputs) {
            for (const output of options.outputs) {
                template += ` (${output})="eventCalled('${output}', $event)"`
            }
        }
    }
    template += `></${selector}>`
    return template
}

interface ByInterface {
    css(selector: string): Predicate<DebugElement>
    directive(type: Type<ANY>): Predicate<DebugNode<DebugElement>> 
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

export function addEvents(...names: string[]): void {
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
                    directive: (type: Type<ANY>) => {
                        return this.queryAllNodes(By.directive(type))
                    }
                }
                return _queryAllNodes
            }
        })

        const attributesDiscriptor = Object.getOwnPropertyDescriptor(DebugElementPrototype, 'attributes')
        Object.defineProperty(DebugElementPrototype, 'attributes', {
            configurable: true,
            enumerable: true,
            get: function() {
                const attrs = attributesDiscriptor.get.bind(this)()
                for (const key of Object.keys(attrs))
                {
                    if ( key.startsWith('ng-reflect-') )
                    {
                        const key1 = key==='ng-reflect-model'?'ngModel':key.substring(11)
                        Object.defineProperty(attrs, key1, {
                            configurable: true,
                            enumerable: true,
                            get: function() { return this[key] }
                        })
                    }
                }
                return attrs
            }
        })

        Object.defineProperty(DebugElementPrototype, 'text', {
            get: function(): string {
                return this.attributes.ngModel || this.nativeElement.innerText
            },
            set: function(value: string): void {
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
                    _triggerEventHandler[eventName] = (objEvent: unknown) => {
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
    get ngModule(): Type<ANY> | Type<ANY>[]
    initTestEnvironment(ngModule: Type<ANY> | Type<ANY>[], platform: PlatformRef, options?: TestEnvironmentOptions): void
    resetTestEnvironment(): void
    resetTestingModule(): TestBedInterface
    configureCompiler(config: {
        providers?: ANY[]
        useJit?: boolean
    }): void
    configureTestingModule(moduleDef: TestModuleMetadata): TestBedInterface
    compileComponents(): Promise<ANY>
    inject<T>(token: ProviderToken<T>, notFoundValue?: T, flags?: InjectFlags): T
    inject<T>(token: ProviderToken<T>, notFoundValue: null, flags?: InjectFlags): T | null
    /** @deprecated from v9.0.0 use TestBed.inject */
    get<T>(token: ProviderToken<T>, notFoundValue?: T, flags?: InjectFlags): ANY
    /** @deprecated from v9.0.0 use TestBed.inject */
    get(token: ANY, notFoundValue?: ANY): ANY
    execute(tokens: ANY[], fn: AFunction, context?: ANY): ANY
    overrideModule(ngModule: Type<ANY>, override: MetadataOverride<NgModule>): TestBedInterface
    overrideComponent(component: Type<ANY>, override: MetadataOverride<Component>): TestBedInterface
    overrideDirective(directive: Type<ANY>, override: MetadataOverride<Directive>): TestBedInterface
    overridePipe(pipe: Type<ANY>, override: MetadataOverride<Pipe>): TestBedInterface
    overrideTemplate(component: Type<ANY>, template: string): TestBedInterface
    overrideProvider(token: ANY, provider: {
        useFactory: AFunction;
        deps: ANY[];
    }): TestBedInterface
    overrideProvider(token: ANY, provider: {
        useValue: ANY
    }): TestBedInterface
    overrideProvider(token: ANY, provider: {
        useFactory?: AFunction
        useValue?: ANY
        deps?: ANY[]
    }): TestBedInterface
    overrideTemplateUsingTestingModule(component: Type<ANY>, template: string): TestBedInterface
    createComponent<T>(component: Type<T>): ComponentFixture<T>
}


export interface ComponentFixture<T, DET = DebugElement> {
    //componentRef: ComponentRef<T>
    ngZone: NgZone | null
    debugElement: DET
    componentInstance: T
    nativeElement: ANY
    //elementRef: ElementRef
    //changeDetectorRef: ChangeDetectorRef
    detectChanges(checkNoChanges?: boolean): void
    checkNoChanges(): void
    autoDetectChanges(autoDetect?: boolean): void
    isStable(): boolean
    whenStable(): Promise<ANY>
    whenRenderingDone(): Promise<ANY>
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
    get inputs(): {[key: string]: ANY}
    get events(): EventEmitter
}

export interface ComponentRef<C> {
    setInput(name: string, value: unknown): void
    get location(): ElementRef
    get injector(): Injector
    get instance(): C
    get hostView(): ViewRef
    get changeDetectorRef(): ChangeDetectorRef
    get componentType(): Type<ANY>
    destroy(): void
    onDestroy(callback: AFunction): void
}

export interface NgZone {
    readonly hasPendingMacrotasks: boolean
    readonly hasPendingMicrotasks: boolean
    readonly isStable: boolean
    readonly onUnstable: EventEmitter
    readonly onMicrotaskEmpty: EventEmitter
    readonly onStable: EventEmitter
    readonly onError: EventEmitter
    run<T>(fn: (...args: ANY[]) => T, applyThis?: ANY, applyArgs?: ANY[]): T;
    runTask<T>(fn: (...args: ANY[]) => T, applyThis?: ANY, applyArgs?: ANY[], name?: string): T;
    runGuarded<T>(fn: (...args: ANY[]) => T, applyThis?: ANY, applyArgs?: ANY[]): T;
    runOutsideAngular<T>(fn: (...args: ANY[]) => T): T;
}

interface DebugElementBase<DET> extends DebugNode<DET> {
    get nativeElement(): HTMLElement
    get name(): string
    get properties(): { [key: string]: ANY }
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
    triggerEventHandler(eventName: string, eventObj?: unknown): void
}

export interface SodaDebugElement<E = CommonEvents> extends DebugElementBase<SodaDebugElement> {
    text: string
    query: { by : { css<E1=E>(selector: string): SodaDebugElement<E1> } }
    queryAll: { by : { css<E1=E>(selector: string): SodaDebugElement<E1>[] } }
    queryAllNodes: {by : {
        directive<E1=E>(type: Type<ANY>): DebugNode<SodaDebugElement<E1>>[],
        all<E1=E>(): DebugNode<SodaDebugElement<E1>>[]
    }}
    triggerEventHandler: E
}

export interface ElementRef<T = ANY> {
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
    get(token: ANY, notFoundValue?: ANY): ANY
}

export interface ViewRef extends ChangeDetectorRef {
    destroy(): void
    get destroyed(): boolean
    onDestroy(callback: AFunction): ANY
}

export interface DebugNode<DET> {
    readonly nativeNode: ANY
    get parent(): DET | null
    get injector(): Injector;
    get componentInstance(): ANY
    get context(): ANY
    get listeners(): DebugEventListener[]
    get references(): { [key: string]: ANY }
    get providerTokens(): ANY[]
}

export interface DebugEventListener {
    name: string
    callback: AFunction
}

export interface Type<T> extends Function {
    new (...args: unknown[]): T;
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
    get(token: ANY, notFoundValue?: ANY): ANY;
    runInContext<ReturnT>(fn: () => ReturnT): ReturnT;
    destroy(): void;
}

export interface ComponentFactoryResolver {
    resolveComponentFactory<T>(component: Type<T>): ComponentFactory<T>;
}

export interface ComponentFactory<C> {
    get selector(): string
    componentType(): Type<ANY>
    get ngContentSelectors(): string[]
    get inputs(): {
        propName: string
        templateName: string
    }[]
    get outputs(): {
        propName: string
        templateName: string
    }[]
    create(injector: Injector, projectableNodes?: ANY[][], rootSelectorOrNode?: string | ANY, environmentInjector?: EnvironmentInjector | NgModuleRef<ANY>): ComponentRef<C>
}

export interface NgModule {
    providers?: Provider[];
    declarations?: Array<Type<ANY> | ANY[]>;
    imports?: Array<Type<ANY> | ModuleWithProviders<ANY> | ANY[]>;
    exports?: Array<Type<ANY> | ANY[]>;
    entryComponents?: Array<Type<ANY> | ANY[]>;
    bootstrap?: Array<Type<ANY> | ANY[]>;
    schemas?: Array<SchemaMetadata | ANY[]>;
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
    animations?: ANY[];
    encapsulation?: ViewEncapsulation;
    interpolation?: [string, string];
    entryComponents?: Array<Type<ANY> | ANY[]>;
    preserveWhitespaces?: boolean;
    standalone?: boolean;
    imports?: (Type<ANY> | ANY[])[];
    schemas?: SchemaMetadata[];
}

export interface Directive {
    selector?: string
    inputs?: string[]
    outputs?: string[]
    providers?: Provider[]
    exportAs?: string
    queries?: { [key: string]: ANY }
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

export interface TestModuleMetadata {
    providers?: ANY[]
    declarations?: ANY[]
    imports?: ANY[]
    schemas?: Array<SchemaMetadata | ANY[]>
    teardown?: ModuleTeardownOptions
    errorOnUnknownElements?: boolean
    errorOnUnknownProperties?: boolean
}

interface ModuleTeardownOptions {
    destroyAfterEach: boolean
    rethrowErrors?: boolean
}

export type MetadataOverride<T> = {
    add?: Partial<T>
    remove?: Partial<T>
    set?: Partial<T>
}

export interface TestEnvironmentOptions {
    teardown?: ModuleTeardownOptions
    errorOnUnknownElements?: boolean
    errorOnUnknownProperties?: boolean
}

export interface Predicate<T> {
    (value: T): boolean
}

export type ProviderToken<T> = Type<T> | AbstractType<T>

interface AbstractType<T> extends AFunction {
    prototype: T
}

export interface BootstrapOptions {
    ngZone?: NgZone | 'zone.js' | 'noop'
    ngZoneEventCoalescing?: boolean
    ngZoneRunCoalescing?: boolean
}

export type CompilerOptions = {
    useJit?: boolean
    defaultEncapsulation?: ViewEncapsulation
    providers?: StaticProvider[]
    missingTranslation?: MissingTranslationStrategy
    preserveWhitespaces?: boolean
}

type StaticProvider = ValueProvider | ExistingProvider | StaticClassProvider | ConstructorProvider | FactoryProvider | ANY[]

interface ValueProvider extends ValueSansProvider {
    provide: ANY
    multi?: boolean
}

interface ValueSansProvider {
    useValue: ANY
}

interface ExistingProvider extends ExistingSansProvider {
    provide: ANY
    multi?: boolean
}

interface ExistingSansProvider {
    useExisting: ANY
}

interface StaticClassProvider extends StaticClassSansProvider {
    provide: ANY
    multi?: boolean
}

interface StaticClassSansProvider {
    useClass: Type<ANY>
    deps: ANY[]
}

interface ConstructorProvider extends ConstructorSansProvider {
    provide: Type<ANY>
    multi?: boolean
}

interface ConstructorSansProvider {
    deps?: ANY[]
}

interface FactoryProvider extends FactorySansProvider {
    provide: ANY
    multi?: boolean
}

interface FactorySansProvider {
    useFactory: AFunction
    deps?: ANY[]
}

enum MissingTranslationStrategy {
    Error = 0,
    Warning = 1,
    Ignore = 2
}

export type Provider = Type<ANY> | ValueProvider | ClassProvider | ConstructorProvider | ExistingProvider | FactoryProvider | ANY[];

interface ClassProvider extends ClassSansProvider {
    provide: ANY
    multi?: boolean
}

interface ClassSansProvider {
    useClass: Type<ANY>
}

export interface ModuleWithProviders<T> {
    ngModule: Type<T>
    providers?: Provider[]
}

export interface SchemaMetadata {
    name: string
}

interface ComponentDecorator {
    (obj: Component): TypeDecorator
    new (obj: Component): Component
}

interface TypeDecorator {
    <T extends Type<ANY>>(type: T): T
    (target: AnObject, propertyKey?: string | symbol, parameterIndex?: number): void
}
