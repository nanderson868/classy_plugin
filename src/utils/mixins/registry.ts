/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base, ISettings } from "./mapped";

/* eslint-disable @typescript-eslint/no-unused-vars */
type Constructor<T> = new (...args: any[]) => T;
type NoInfer<T> = [T][T extends any ? 0 : never];

export class TypeRegistry<BaseType extends object> {
	#map = new Map<Constructor<BaseType>, BaseType>();

	keys = () => {
		return this.#map.keys();
	};

	set = <T extends BaseType>(ctor: Constructor<T>, instance: NoInfer<T>) => {
		this.#map.set(ctor, instance);
		return this;
	};
	get = <T extends BaseType>(ctor: Constructor<T>): T | undefined => {
		const val = this.#map.get(ctor);
		if (val && !(val instanceof ctor)) {
			throw new Error("Invalid value");
		}

		return val;
	};

	has = <T extends BaseType>(ctor: Constructor<T>): boolean => {
		return this.#map.has(ctor);
	};
}

export class TypeDataRegistry<BaseType extends Base> {
	#map = new Map<Constructor<BaseType>, BaseType["_settings"]>();

	set = <T extends BaseType, S extends T["_settings"]>(
		ctor: Constructor<T>,
		data: NoInfer<S>
	) => {
		this.#map.set(ctor, data);
		return this;
	};

	get = <T extends BaseType>(
		ctor: Constructor<T>
	): T["_settings"] | undefined => {
		const val = this.#map.get(ctor);
		if (val && !(val instanceof ctor)) {
			throw new Error("Invalid value");
		}

		return val;
	};
}

function test() {
	const registry = new TypeRegistry<Component>();

	abstract class Component {
		#someComponentStuff = true;
	}

	class Foo extends Component {
		isFoo = true;
	}

	class Bar extends Component {
		isBar = true;
	}

	class FakeComponent {
		#someComponentStuff = true;
	}

	registry.set(Foo, new Foo());
	registry.set(Bar, new Bar());

	const get = registry.get;

	// @ts-expect-error ...
	registry.set("Foo", 42); // "Foo" is not a class
	// @ts-expect-error ...
	registry.set(Foo, new Bar()); // Value is not an instance of Foo
	// @ts-expect-error ...
	registry.set(FakeComponent, new FakeComponent());
}
