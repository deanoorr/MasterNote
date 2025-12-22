import fetch from 'node-fetch';

const apiKey = "sk-scira-XqpLCvEhDvAQOMJPrrwgxprZIyrUejxxNpmPVuHrkSHqpjumHrvbEAyLhXcSBkHT";
const endpoint = "https://api.scira.ai/api/xsearch";

async function test() {
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({ query: "latest on SpaceX" })
        });

        const text = await response.text();
        console.log("Raw Response:", text);
        try {
            const data = JSON.parse(text);
            console.log(JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("Not JSON");
        }
    } catch (e) {
        console.error(e);
    }
}

test();
