using Amazon.Lambda.Core;
using Amazon.SimpleSystemsManagement;
using Amazon.SimpleSystemsManagement.Model;

namespace CSharp;

public class Functions
{
    private static readonly AmazonSimpleSystemsManagementClient SsmClient = new();
    
    public async Task Handler(ILambdaContext context)
    {
        var logger = context.Logger;
        if (int.TryParse(await GetParameter("PrimeNumbersCounterLimit", logger), out var limit))
        {
            try
            {
                logger.LogLine($"Counting prime numbers up to {limit}...");
                logger.LogLine($"Found {CountPrimes(limit)} prime numbers.");
            }
            catch (Exception ex)
            {
                logger.LogLine($"Error counting prime numbers: {ex.Message}");
            }
        }
        else
        {
            logger.LogLine("Invalid limit value.");
        }
    }
    
    private static int CountPrimes(int limit)
    {
        var count = 0;
        for (var num = 2; num < limit; num++)
        {
            var isPrime = true;
            for (var i = 2; i <= Math.Sqrt(num); i++)
            {
                if (num % i != 0) continue;
                isPrime = false;
                break;
            }
            if (isPrime) count++;
        }
        return count;
    }
    
    private static async Task<string?> GetParameter(string name, ILambdaLogger logger)
    {
        try {
            var request = new GetParameterRequest
            {
                Name = name
            };

            var response = await SsmClient.GetParameterAsync(request);
            return response.Parameter.Value;
        }
        catch (Exception ex)
        {
            logger.LogLine($"Error retrieving parameters: {ex.Message}");
            return null;
        }
    }
}
