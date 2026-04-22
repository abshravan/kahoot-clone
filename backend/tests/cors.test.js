describe('isOriginAllowed', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.CLIENT_ORIGIN;
  });

  function load(envValue) {
    jest.resetModules();
    if (envValue === undefined) delete process.env.CLIENT_ORIGIN;
    else process.env.CLIENT_ORIGIN = envValue;
    return require('../src/config/cors');
  }

  test('allows any origin when CLIENT_ORIGIN is "*"', () => {
    const { isOriginAllowed } = load('*');
    expect(isOriginAllowed('http://evil.example')).toBe(true);
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
  });

  test('allows comma-separated list', () => {
    const { isOriginAllowed } = load('http://localhost:3000, https://app.example.com');
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('https://app.example.com')).toBe(true);
    expect(isOriginAllowed('http://other.example')).toBe(false);
  });

  test('allows requests with no Origin header', () => {
    const { isOriginAllowed } = load('http://localhost:3000');
    expect(isOriginAllowed(undefined)).toBe(true);
    expect(isOriginAllowed(null)).toBe(true);
  });
});
