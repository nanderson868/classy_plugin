import { Logger } from "./logging";

class SampleService {
	protected log: Logger = new Logger().setContext(this);

	constructor() {
		// Logger is automatically initialized with the class name and log level
		this.log.setContext(this);
		this.log.debug("SampleService initialized");
	}

	doSomething() {
		this.log.info("Doing something...");
		// Simulate an error
		try {
			throw new Error("Something went wrong");
		} catch (error) {
			this.log.error("Error occurred: ", error);
		}
	}
}

// Usage example
const service = new SampleService();
service.doSomething();
