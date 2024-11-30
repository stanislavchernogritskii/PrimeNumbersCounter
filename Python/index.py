import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ssm = boto3.client('ssm')

def handler(event, context):
    limit = int(ssm.get_parameter(Name = 'PrimeNumbersCounterLimit')['Parameter']['Value'])
    primes = []
    for num in range(2, limit):
        is_prime = all(num % i != 0 for i in range(2, int(num**0.5) + 1))
        if is_prime:
            primes.append(num)

    logger.info(len(primes))