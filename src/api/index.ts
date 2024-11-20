/* eslint-disable no-mixed-spaces-and-tabs */
import { MetadataMenuAPI } from "@/api/metadata-menu";
import { DataviewAPI } from "@/api/dataview";
import { TemplaterAPI } from "@/api/templater";
import { expectTypeOf } from "expect-type";
import { App } from "obsidian";
import { Logger } from "@/utils/logging";

const DELIM = ".";

type Plugins = {
	dataview: DataviewAPI;
	"metadata-menu": MetadataMenuAPI;
	"templater-obsidian": TemplaterAPI;
};

type TargetApp = {
	plugins: {
		enabledPlugins: Set<keyof Plugins>;
		plugins: Plugins;
	};
};

type SubPaths<T> = T extends object
	? {
			[K in keyof T]-?: K extends string | number
				?
						| K
						| (SubPaths<T[K]> extends infer D
								? D extends never
									? never
									: `${K}${typeof DELIM}${D & string}`
								: never)
				: never;
	  }[keyof T]
	: never;

type Split<
	S extends string,
	D extends string = typeof DELIM
> = S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

const split = <S extends string>(str: S, del = DELIM) =>
	str.split(del) as Split<S>;

type ResolvePath<Obj, Path> =
	Path extends `${infer First}${typeof DELIM}${infer Rest}`
		? First extends keyof Obj
			? ResolvePath<Obj[First], Rest>
			: never
		: Path extends keyof Obj
		? Obj[Path]
		: never;

const resolvePath = <Obj extends Record<string, object>, Path extends string>(
	obj: Obj,
	path: Array<string>
) =>
	path.reduce((acc, part) => acc[part] as Obj, obj) as ResolvePath<Obj, Path>;

/**
 * Dynamic path resolution for enabled plugin APIs
 */
export class APIProxy<
	Paths extends {
		[key in keyof Paths]: Paths[key] extends SubPaths<Plugins>
			? Paths[key]
			: never;
	} = object
> {
	private app: TargetApp;
	public api = this.createProxy();
	private log = new Logger().setContext(this);

	constructor(app: App | TargetApp, public paths: Paths = {} as Paths) {
		this.app = app as unknown as TargetApp;
	}

	public addPath<K extends string, V extends SubPaths<Plugins>>(
		alias: K,
		path: V
	) {
		if (path in this.paths) throw new Error(`Path ${path} already exists`);
		return new APIProxy<Paths & { [key in K]: V }>(this.app, {
			...this.paths,
			[alias]: path,
		} as Paths & { [key in K]: V });
	}

	private createProxy() {
		// this.log.info("createProxy", this.paths);
		return new Proxy(
			{} as {
				[K in keyof Paths]: ReturnType<typeof this.getAPI<K>>;
			},
			{
				get: <T extends Paths, K extends keyof T & string>(
					target: T,
					prop: K,
					receiver: unknown
				) => {
					if (prop in target)
						return Reflect.get(target, prop, receiver);
					if (prop in this.paths) {
						const api = this.getAPI(prop);
						Reflect.set(target, prop, api, receiver);
						return api;
					}
				},
			}
		);
	}

	public getAPI<K extends keyof Paths>(alias: K) {
		this.log.info("getAPI", alias, this.paths[alias]);
		return resolvePath<Plugins, Paths[K]>(
			this.app.plugins.plugins,
			split(this.paths[alias])
		);
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const compiletimeTests = {
	test1() {
		const proxy = new APIProxy(app);
		const proxy0 = proxy.addPath("dv", "dataview.api");

		expectTypeOf(proxy0.api.dv.page).toEqualTypeOf<
			DataviewAPI["api"]["page"]
		>();
	},
	test2() {
		const proxy1 = new APIProxy(app)
			.addPath("dv", "dataview.api")
			.addPath("meta", "metadata-menu.api")
			.addPath(
				"tp",
				"templater-obsidian.templater.current_functions_object"
			);

		expectTypeOf(proxy1.paths.dv).toEqualTypeOf<"dataview.api">();

		expectTypeOf(split(proxy1.paths.dv)).toEqualTypeOf<
			["dataview", "api"]
		>();
		expectTypeOf(proxy1.api.dv).toEqualTypeOf<DataviewAPI["api"]>();

		expectTypeOf(proxy1.getAPI("dv")).toEqualTypeOf<DataviewAPI["api"]>;

		// @ts-expect-error ...
		proxy1.addPath("dv", "dataview.foobar");

		// @ts-expect-error ...
		expectTypeOf(proxy1.getAPI("meta")).toEqualTypeOf<DataviewAPI["api"]>();

		expectTypeOf(proxy1.getAPI("dv")).toEqualTypeOf<
			// @ts-expect-error ...
			MetadataMenuAPI["api"]
		>();

		// @ts-expect-error ...
		expectTypeOf(proxy1.getAPI("dv")).toEqualTypeOf<DataviewAPI>();

		// @ts-expect-error ...
		expectTypeOf(proxy1.getAPI("fooobar"));
	},
};
