#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PrimeNumbersCounterStack } from '../lib/prime_numbers_counter-stack';

const app = new cdk.App();
new PrimeNumbersCounterStack(app, 'PrimeNumbersCounterStack');
