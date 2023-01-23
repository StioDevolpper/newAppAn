import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import {Configuration, OpenAIApi} from 'openai'
import say from 'say';
import fs from 'fs';

dotenv.config()

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'Hello from KMHDSs!'
    })
})

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        console.log('prompt s', prompt);
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${prompt}`,
            temperature: 0, // Higher values means the model will take more risks.
            max_tokens: 1024, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
            top_p: 1, // alternative to sampling with temperature, called nucleus sampling
            frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
            presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
        });
        console.log('resssss', response.data.choices[0].text);
        res.status(200).send({
            bot: response.data.choices[0].text
        });

    } catch (error) {
        console.error(error)
        res.status(500).send(error || 'Something went wrong');
    }
})

app.post('/tts', async (req, res) => {
    const text = req.body.prompt;
    const lang = req.body.lang;
    const filename = 'audio.mp3';
    const language = 'fr';
    say.export(text, "", 1.1, 'audio.mp3', (err) => {
        if (err) {
            return console.error(err);
        }
        console.log("Audio file created!");
        fs.readFile(filename, (err, audio) => {
            if (err) {
                return console.error(err);
            }
            //const formData = new FormData();
            //formData.append('audio', audio, filename);
            const audioBuffer = new Buffer.from(audio);
            res.status(200).set("Content-Type", "audio.mp3").send(audioBuffer);
        });
    });

// Delete the audio file
    fs.unlink('audio.mp3', (err) => {
        if (err) {
            return console.error(err);
        }
        console.log("Audio file deleted!");
    });

})

app.listen(5000, () => console.log('AI server started on http://localhost:5000'))
