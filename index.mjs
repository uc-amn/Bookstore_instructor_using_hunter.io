import fs from 'fs';
import fetch from 'node-fetch';

const apiKey = 'c1b4b6a557ab5d539465133bc6054cc41ade1e09';
const baseUrl = 'https://api.hunter.io/v2/email-finder';

async function fetchEmailData(firstName, lastName, domain) {
    const url = `${baseUrl}?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

async function processCSVAndFetchEmails(csvData) {
    const lines = csvData.trim().split('\n');
    const emailResults = [];
    const emailNotFoundResults = [];

    // Iterate through each line of the CSV
    for (const line of lines) {
        const columns = line.split(',');
        if (columns.length >= 5) {
            const thirdColumn = columns[2].trim();
            const fifthColumn = columns[4].trim();
            const [firstName, lastName] = thirdColumn.split(' ');

            const emailData = await fetchEmailData(firstName, lastName, fifthColumn);
            let email = '';

            if (emailData && emailData.data && emailData.data.email) {
                email = emailData.data.email;
            } else {
                email = 'No email found';
            }

            // Replace the sixth column (email column) with the fetched email
            columns[5] = email;

            if (email === 'No email found') {
                emailNotFoundResults.push(columns.join(','));
            } else {
                emailResults.push(columns.join(','));
            }
        } else {
            emailResults.push(line);
        }

        // Introduce a delay of 1000 milliseconds (1 second) between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { emailResults, emailNotFoundResults };
}

fs.readFile('sample.csv', 'utf8', async(err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
    } else {
        const { emailResults, emailNotFoundResults } = await processCSVAndFetchEmails(data);

        // Combine the email results and email not found results
        const combinedResults = emailResults.concat(emailNotFoundResults);

        // Join the combined results into a single string
        const combinedCSV = combinedResults.join('\n');

        // Write the combined results to a new file
        fs.writeFile('combined_results.csv', combinedCSV, 'utf8', err => {
            if (err) {
                console.error('Error writing combined results to file:', err);
            } else {
                console.log('Combined results written to combined_results.csv');
            }
        });
    }
});