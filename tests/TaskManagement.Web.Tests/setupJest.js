const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add any other required globals here
global.fetch = require('jest-fetch-mock');

// Load jest-dom extensions
require('@testing-library/jest-dom');