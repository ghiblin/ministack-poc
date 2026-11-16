import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers'
import { S3Config } from '../../src/config';

const MINISTACK_PORT = 4566;

export interface RunningMiniStack {
    container: StartedTestContainer;
    config: S3Config;
}

export async function startMiniStack(): Promise<RunningMiniStack> {
    const container = await new GenericContainer("ministackorg/ministack:latest") // pin a version in CI
        .withExposedPorts(MINISTACK_PORT)
        .withWaitStrategy(Wait.forHttp("/_ministack/health", MINISTACK_PORT).forStatusCode(200))
        .start();

    const endpoint = `http://${container.getHost()}:${container.getMappedPort(MINISTACK_PORT)}`;

    return {
        container,
        config: {
            endpoint,
            region: "us-east-1",
            credentials: { accessKeyId: "test", secretAccessKey: "test" },
        },
    };
}