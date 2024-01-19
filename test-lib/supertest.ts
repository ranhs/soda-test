import EventEmitter = require("events");
import * as http from "http";
import * as https from "https";
import { IncomingMessage } from "http";

type ANY = any // eslint-disable-line @typescript-eslint/no-explicit-any
type AnObject = Object // eslint-disable-line @typescript-eslint/ban-types

export interface Test extends SuperAgentRequest {
    app?: ANY;
    url: string;
    serverAddress(app: ANY, path: string): string;
    expect(status: number, callback?: CallbackHandler): this;
    expect(status: number, body: ANY, callback?: CallbackHandler): this;
    expect(checker: (res: Response) => ANY, callback?: CallbackHandler): this;
    expect(body: string, callback?: CallbackHandler): this;
    expect(body: RegExp, callback?: CallbackHandler): this;
    expect(body: AnObject, callback?: CallbackHandler): this;
    expect(field: string, val: string, callback?: CallbackHandler): this;
    expect(field: string, val: RegExp, callback?: CallbackHandler): this;
    end(callback?: CallbackHandler): this;
}

type SuperAgentRequest = Request;

interface Request extends SARequest {}

interface SARequest extends Stream {
    attach(
        field: string,
        file: MultipartValueSingle,
        options?: string | { filename?: string | undefined; contentType?: string | undefined },
    ): this;

    abort(): this;
    accept(type: string): this;
    agent(): SAgent | http.Agent | https.Agent;
    agent(agent: SAgent | http.Agent | https.Agent): this;
    auth(token: string, options: { type: "bearer" }): this;
    auth(user: string, pass: string, options?: { type: "basic" | "auto" }): this;
    buffer(val?: boolean): this;
    ca(cert: string | string[] | Buffer | Buffer[]): this;
    catch<TResult = never>(
        onrejected?: ((reason: ANY) => TResult | PromiseLike<TResult>) | null,
    ): Promise<ResponseBase | TResult>;
    cert(cert: string | string[] | Buffer | Buffer[]): this;
    clearTimeout(): this;
    connect(override: string | { [hostname: string]: false | string | { host: string; port: number } }): this;
    disableTLSCerts(): this;
    end(callback?: CBHandler): void;
    field(
        fields: {
            [fieldName: string]:
                | (string | number | boolean | Blob | Buffer | ReadStream)
                | Array<string | number | boolean | Blob | Buffer | ReadStream>;
        },
    ): this;
    field(
        name: string,
        val:
            | (string | number | boolean | Blob | Buffer | ReadStream)
            | Array<string | number | boolean | Blob | Buffer | ReadStream>,
    ): this;
    finally(onfinally?: (() => void) | null): Promise<ResponseBase>;
    get(header: string): string;
    getHeader(header: string): string;
    http2(enable?: boolean): this;
    key(cert: string | string[] | Buffer | Buffer[]): this;
    lookup(): LookupFunction;
    lookup(lookup: LookupFunction): this;
    maxResponseSize(n: number): this;
    ok(callback: (res: ResponseBase) => boolean): this;
    parse(
        parser:
            | ((str: string) => ANY)
            | ((res: ResponseBase, callback: (err: Error | null, body: ANY) => void) => void),
    ): this;
    pfx(cert: string | string[] | Buffer | Buffer[] | { pfx: string | Buffer; passphrase: string }): this;
    query(val: Record<string, ANY> | string): this;
    redirects(n: number): this;
    responseType(type: string): this;
    retry(count?: number, callback?: CBHandler): this;
    send(data?: string | object): this;
    serialize(serializer: (obj: ANY) => string): this;
    set(field: "Cookie", val: string[]): this;
    set(field: Record<string, string>): this;
    set(field: string, val: string): this;
    sortQuery(sort?: boolean | ((a: string, b: string) => number)): this;
    then<TResult1 = ResponseBase, TResult2 = never>(
        onfulfilled?: ((value: ResponseBase) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: ANY) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2>;
    timeout(ms: number | { deadline?: number; response?: number }): this;
    toJSON(): { method: string; url: string; data?: string | object; headers: Array<string | string[]> };
    trustLocalhost(enabled?: boolean): this;
    type(val: string): this;
    unset(field: string): this;
    use(fn: (req: this) => void): this;
    withCredentials(on?: boolean): this;
    write(data: string | Buffer, encoding?: string): boolean;
}

interface Stream extends internal {}

interface internal extends EventEmitter {
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean | undefined }): T;
}

type MultipartValueSingle = Blob | Buffer | ReadStream | string | boolean | number;

interface ReadStream extends Readable {
    close(callback?: (err?: NodeJS.ErrnoException | null) => void): void;
    addListener(event: "close", listener: () => void): this;
    addListener(event: "data", listener: (chunk: Buffer | string) => void): this;
    addListener(event: "end", listener: () => void): this;
    addListener(event: "error", listener: (err: Error) => void): this;
    addListener(event: "open", listener: (fd: number) => void): this;
    addListener(event: "pause", listener: () => void): this;
    addListener(event: "readable", listener: () => void): this;
    addListener(event: "ready", listener: () => void): this;
    addListener(event: "resume", listener: () => void): this;
    addListener(event: string | symbol, listener: (...args: ANY[]) => void): this;

    on(event: "close", listener: () => void): this;
    on(event: "data", listener: (chunk: Buffer | string) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "open", listener: (fd: number) => void): this;
    on(event: "pause", listener: () => void): this;
    on(event: "readable", listener: () => void): this;
    on(event: "ready", listener: () => void): this;
    on(event: "resume", listener: () => void): this;
    on(event: string | symbol, listener: (...args: ANY[]) => void): this;

    once(event: "close", listener: () => void): this;
    once(event: "data", listener: (chunk: Buffer | string) => void): this;
    once(event: "end", listener: () => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    once(event: "open", listener: (fd: number) => void): this;
    once(event: "pause", listener: () => void): this;
    once(event: "readable", listener: () => void): this;
    once(event: "ready", listener: () => void): this;
    once(event: "resume", listener: () => void): this;
    once(event: string | symbol, listener: (...args: ANY[]) => void): this;

    prependListener(event: "close", listener: () => void): this;
    prependListener(event: "data", listener: (chunk: Buffer | string) => void): this;
    prependListener(event: "end", listener: () => void): this;
    prependListener(event: "error", listener: (err: Error) => void): this;
    prependListener(event: "open", listener: (fd: number) => void): this;
    prependListener(event: "pause", listener: () => void): this;
    prependListener(event: "readable", listener: () => void): this;
    prependListener(event: "ready", listener: () => void): this;
    prependListener(event: "resume", listener: () => void): this;
    prependListener(event: string | symbol, listener: (...args: ANY[]) => void): this;

    prependOnceListener(event: "close", listener: () => void): this;
    prependOnceListener(event: "data", listener: (chunk: Buffer | string) => void): this;
    prependOnceListener(event: "end", listener: () => void): this;
    prependOnceListener(event: "error", listener: (err: Error) => void): this;
    prependOnceListener(event: "open", listener: (fd: number) => void): this;
    prependOnceListener(event: "pause", listener: () => void): this;
    prependOnceListener(event: "readable", listener: () => void): this;
    prependOnceListener(event: "ready", listener: () => void): this;
    prependOnceListener(event: "resume", listener: () => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: ANY[]) => void): this;
}

interface Readable extends Stream {

    readable: boolean;
    readonly readableEncoding: BufferEncoding | null;
    readonly readableEnded: boolean;
    readonly readableFlowing: boolean | null;
    readonly readableHighWaterMark: number;
    readonly readableLength: number;
    readonly readableObjectMode: boolean;
    destroyed: boolean;
    _read(size: number): void;
    read(size?: number): ANY;
    setEncoding(encoding: BufferEncoding): this;
    pause(): this;
    resume(): this;
    isPaused(): boolean;
    unpipe(destination?: NodeJS.WritableStream): this;
    unshift(chunk: ANY, encoding?: BufferEncoding): void;
    wrap(oldStream: NodeJS.ReadableStream): this;
    push(chunk: ANY, encoding?: BufferEncoding): boolean;
    _destroy(error: Error | null, callback: (error?: Error | null) => void): void;
    destroy(error?: Error): this;
    addListener(event: "close", listener: () => void): this;
    addListener(event: "data", listener: (chunk: ANY) => void): this;
    addListener(event: "end", listener: () => void): this;
    addListener(event: "error", listener: (err: Error) => void): this;
    addListener(event: "pause", listener: () => void): this;
    addListener(event: "readable", listener: () => void): this;
    addListener(event: "resume", listener: () => void): this;
    addListener(event: string | symbol, listener: (...args: ANY[]) => void): this;

    emit(event: "close"): boolean;
    emit(event: "data", chunk: ANY): boolean;
    emit(event: "end"): boolean;
    emit(event: "error", err: Error): boolean;
    emit(event: "pause"): boolean;
    emit(event: "readable"): boolean;
    emit(event: "resume"): boolean;
    emit(event: string | symbol, ...args: ANY[]): boolean;

    on(event: "close", listener: () => void): this;
    on(event: "data", listener: (chunk: ANY) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "pause", listener: () => void): this;
    on(event: "readable", listener: () => void): this;
    on(event: "resume", listener: () => void): this;
    on(event: string | symbol, listener: (...args: ANY[]) => void): this;

    once(event: "close", listener: () => void): this;
    once(event: "data", listener: (chunk: ANY) => void): this;
    once(event: "end", listener: () => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    once(event: "pause", listener: () => void): this;
    once(event: "readable", listener: () => void): this;
    once(event: "resume", listener: () => void): this;
    once(event: string | symbol, listener: (...args: ANY[]) => void): this;

    prependListener(event: "close", listener: () => void): this;
    prependListener(event: "data", listener: (chunk: ANY) => void): this;
    prependListener(event: "end", listener: () => void): this;
    prependListener(event: "error", listener: (err: Error) => void): this;
    prependListener(event: "pause", listener: () => void): this;
    prependListener(event: "readable", listener: () => void): this;
    prependListener(event: "resume", listener: () => void): this;
    prependListener(event: string | symbol, listener: (...args: ANY[]) => void): this;

    prependOnceListener(event: "close", listener: () => void): this;
    prependOnceListener(event: "data", listener: (chunk: ANY) => void): this;
    prependOnceListener(event: "end", listener: () => void): this;
    prependOnceListener(event: "error", listener: (err: Error) => void): this;
    prependOnceListener(event: "pause", listener: () => void): this;
    prependOnceListener(event: "readable", listener: () => void): this;
    prependOnceListener(event: "resume", listener: () => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: ANY[]) => void): this;

    removeListener(event: "close", listener: () => void): this;
    removeListener(event: "data", listener: (chunk: ANY) => void): this;
    removeListener(event: "end", listener: () => void): this;
    removeListener(event: "error", listener: (err: Error) => void): this;
    removeListener(event: "pause", listener: () => void): this;
    removeListener(event: "readable", listener: () => void): this;
    removeListener(event: "resume", listener: () => void): this;
    removeListener(event: string | symbol, listener: (...args: ANY[]) => void): this;

    [Symbol.asyncIterator](): AsyncIterableIterator<ANY>;
}

interface Agent<Req extends Request = Request> extends AgentBase {
    "M-SEARCH"(url: string, callback?: CBHandler): Req;
    "m-search"(url: string, callback?: CBHandler): Req;
    ACL(url: string, callback?: CBHandler): Req;
    BIND(url: string, callback?: CBHandler): Req;
    CHECKOUT(url: string, callback?: CBHandler): Req;
    CONNECT(url: string, callback?: CBHandler): Req;
    COPY(url: string, callback?: CBHandler): Req;
    DELETE(url: string, callback?: CBHandler): Req;
    GET(url: string, callback?: CBHandler): Req;
    HEAD(url: string, callback?: CBHandler): Req;
    LINK(url: string, callback?: CBHandler): Req;
    LOCK(url: string, callback?: CBHandler): Req;
    MERGE(url: string, callback?: CBHandler): Req;
    MKACTIVITY(url: string, callback?: CBHandler): Req;
    MKCALENDAR(url: string, callback?: CBHandler): Req;
    MKCOL(url: string, callback?: CBHandler): Req;
    MOVE(url: string, callback?: CBHandler): Req;
    NOTIFY(url: string, callback?: CBHandler): Req;
    OPTIONS(url: string, callback?: CBHandler): Req;
    PATCH(url: string, callback?: CBHandler): Req;
    POST(url: string, callback?: CBHandler): Req;
    PROPFIND(url: string, callback?: CBHandler): Req;
    PROPPATCH(url: string, callback?: CBHandler): Req;
    PURGE(url: string, callback?: CBHandler): Req;
    PUT(url: string, callback?: CBHandler): Req;
    REBIND(url: string, callback?: CBHandler): Req;
    REPORT(url: string, callback?: CBHandler): Req;
    SEARCH(url: string, callback?: CBHandler): Req;
    SOURCE(url: string, callback?: CBHandler): Req;
    SUBSCRIBE(url: string, callback?: CBHandler): Req;
    TRACE(url: string, callback?: CBHandler): Req;
    UNBIND(url: string, callback?: CBHandler): Req;
    UNLINK(url: string, callback?: CBHandler): Req;
    UNLOCK(url: string, callback?: CBHandler): Req;
    UNSUBSCRIBE(url: string, callback?: CBHandler): Req;
    acl(url: string, callback?: CBHandler): Req;
    bind(url: string, callback?: CBHandler): Req;
    checkout(url: string, callback?: CBHandler): Req;
    connect(url: string, callback?: CBHandler): Req;
    copy(url: string, callback?: CBHandler): Req;
    delete(url: string, callback?: CBHandler): Req;
    del(url: string, callback?: CBHandler): Req;
    get(url: string, callback?: CBHandler): Req;
    head(url: string, callback?: CBHandler): Req;
    link(url: string, callback?: CBHandler): Req;
    lock(url: string, callback?: CBHandler): Req;
    merge(url: string, callback?: CBHandler): Req;
    mkactivity(url: string, callback?: CBHandler): Req;
    mkcalendar(url: string, callback?: CBHandler): Req;
    mkcol(url: string, callback?: CBHandler): Req;
    move(url: string, callback?: CBHandler): Req;
    notify(url: string, callback?: CBHandler): Req;
    options(url: string, callback?: CBHandler): Req;
    patch(url: string, callback?: CBHandler): Req;
    post(url: string, callback?: CBHandler): Req;
    propfind(url: string, callback?: CBHandler): Req;
    proppatch(url: string, callback?: CBHandler): Req;
    purge(url: string, callback?: CBHandler): Req;
    put(url: string, callback?: CBHandler): Req;
    rebind(url: string, callback?: CBHandler): Req;
    report(url: string, callback?: CBHandler): Req;
    search(url: string, callback?: CBHandler): Req;
    source(url: string, callback?: CBHandler): Req;
    subscribe(url: string, callback?: CBHandler): Req;
    trace(url: string, callback?: CBHandler): Req;
    unbind(url: string, callback?: CBHandler): Req;
    unlink(url: string, callback?: CBHandler): Req;
    unlock(url: string, callback?: CBHandler): Req;
    unsubscribe(url: string, callback?: CBHandler): Req;
}

type SAgent = Agent;

interface AgentBase {
    use(...args: ANY[]): this;
    on(...args: ANY[]): this;
    once(...args: ANY[]): this;
    set(...args: ANY[]): this;
    query(...args: ANY[]): this;
    type(...args: ANY[]): this;
    accept(...args: ANY[]): this;
    auth(...args: ANY[]): this;
    withCredentials(...args: ANY[]): this;
    sortQuery(...args: ANY[]): this;
    retry(...args: ANY[]): this;
    ok(...args: ANY[]): this;
    redirects(...args: ANY[]): this;
    timeout(...args: ANY[]): this;
    buffer(...args: ANY[]): this;
    serialize(...args: ANY[]): this;
    parse(...args: ANY[]): this;
    ca(...args: ANY[]): this;
    key(...args: ANY[]): this;
    pfx(...args: ANY[]): this;
    cert(...args: ANY[]): this;
    disableTLSCert(...args: ANY[]): this;
}

export type CBHandler = (err: ANY, res: Response) => void;

interface Response extends Stream {
    accepted: boolean;
    badRequest: boolean;
    body: ANY;
    charset: string;
    clientError: boolean;
    error: false | HTTPError;
    files: ANY;
    forbidden: boolean;
    get(header: string): string;
    get(header: "Set-Cookie"): string[];
    header: { [index: string]: string };
    headers: { [index: string]: string };
    info: boolean;
    links: Record<string, string>;
    noContent: boolean;
    notAcceptable: boolean;
    notFound: boolean;
    ok: boolean;
    redirect: boolean;
    request: InstanceType<typeof Request>;
    serverError: boolean;
    status: number;
    statusCode: number;
    statusType: number;
    text: string;
    type: string;
    unauthorized: boolean;
    xhr: ANY;
    redirects: string[];
    setEncoding(encoding: BufferEncoding): IncomingMessage;
}

type ResponseBase = Response;

interface HTTPError extends Error {
    status: number;
    text: string;
    method: string;
    path: string;
}

type LookupFunction = (
    hostname: string,
    options: LookupOneOptions,
    callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
) => void;

interface LookupOneOptions extends LookupOptions {
    all?: false | undefined;
}

interface LookupOptions {
    family?: number | undefined;
    hints?: number | undefined;
    all?: boolean | undefined;
    verbatim?: boolean | undefined;
}

type CallbackHandler = (err: ANY, res: Response) => void;

export interface SuperTest<T extends SuperAgentRequest> extends SuperAgent<T> {
    host(host: string): T;
}

type SuperAgent<Req extends Request = Request> = RequestMethods<Req> & Stream;

type RequestMethods<Req extends Request> = {
    [key in (typeof methods[number]) | "del"]: HttpMethod<Req>;
};

type HttpMethod<Req extends Request> =
    | ((url: string, callback?: CBHandler) => Req)
    | ((url: string, data?: string | Record<string, ANY>, callback?: CBHandler) => Req);

type Method =
    | "ACL"
    | "BIND"
    | "CHECKOUT"
    | "CONNECT"
    | "COPY"
    | "DELETE"
    | "GET"
    | "HEAD"
    | "LINK"
    | "LOCK"
    | "M-SEARCH"
    | "MERGE"
    | "MKACTIVITY"
    | "MKCALENDAR"
    | "MKCOL"
    | "MOVE"
    | "NOTIFY"
    | "OPTIONS"
    | "PATCH"
    | "POST"
    | "PROPFIND"
    | "PROPPATCH"
    | "PURGE"
    | "PUT"
    | "REBIND"
    | "REPORT"
    | "SEARCH"
    | "SOURCE"
    | "SUBSCRIBE"
    | "TRACE"
    | "UNBIND"
    | "UNLINK"
    | "UNLOCK"
    | "UNSUBSCRIBE"
    | "acl"
    | "bind"
    | "checkout"
    | "connect"
    | "copy"
    | "delete"
    | "get"
    | "head"
    | "link"
    | "lock"
    | "m-search"
    | "merge"
    | "mkactivity"
    | "mkcalendar"
    | "mkcol"
    | "move"
    | "notify"
    | "options"
    | "patch"
    | "post"
    | "propfind"
    | "proppatch"
    | "purge"
    | "put"
    | "rebind"
    | "report"
    | "search"
    | "source"
    | "subscribe"
    | "trace"
    | "unbind"
    | "unlink"
    | "unlock"
    | "unsubscribe";

declare const methods: Method[];
