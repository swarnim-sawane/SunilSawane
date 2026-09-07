#!/usr/bin/env node
'use strict';

const {
  getProductionReadinessIssues,
} = require('../src/utils/production-readiness');

const env = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'production',
};

const issues = getProductionReadinessIssues(env);

if (issues.length > 0) {
  console.error('Production readiness check failed:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Production readiness check passed.');
