import {Component, OnInit, ElementRef, ViewChild} from '@angular/core';
declare var $: any;
$('#elemId').width();
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  resulTextAreaValue = '';
  title = 'guideAske';
  initialAudio = false;
  @ViewChild("resultTextarea") resultTextarea!: ElementRef;
  @ViewChild('messages') messages!: ElementRef;
  @ViewChild('buttonMicro') buttonMicro!: ElementRef;
  listeningMc = false;
  desktopSafariMc = false;
  showActionMenu = false;
  loadInterval: any;
  lastSentences : string[] = [];
  speakAudio: any;
  synth: any;
  lang = 'en-US';
  historyKey = "hist";
  volume: boolean;
  urlParams = new URLSearchParams(window.location.search);
  conversation = JSON.parse(localStorage.getItem(this.historyKey) || "[]");
  openings = {
    "en-US": "Greetings! How's everything going on your end?",
    "de-DE": "Grüße! Wie läuft es bei dir?",
    "es-ES": "¡Saludos! ¿Cómo estás?",
    "fr-FR": "Salutations! Comment ça va de votre côté?"
  };
  appleExpression = /Apple/i;
  safariExpression = /Safari/i;
  window : any ;

  AudioContext = window.AudioContext;//  || window.webkitAudioContext;
  context = new AudioContext(); // Make it crossbrowser
  gainNode = this.context.createGain();
  // set volume to 100%
  playButton = document.querySelector('#play');
  yodelBuffer = void 0;

  constructor() {
    this.gainNode.gain.value = 1;
    this.window = (window as any).global = window;
    const volume = localStorage.getItem("volume");
    if (volume !== null) {
      this.volume = JSON.parse(volume);
    } else {
      this.volume = true;
    }
  }
  ngOnInit() {
    this.speakAudio = new Audio();
    this.synth = this.window.speechSynthesis;
    this.speakAudio.autoplay = true;
    this.speakAudio.muted = true;
    if(this.hasCharacter()){
      var character = this.getCharacterOrEmpty();
      this.historyKey = this.historyKey + "_" + character;
    }

    this.conversation = JSON.parse(localStorage.getItem(this.historyKey) || "[]");
    this.detectLanguage();
    window.addEventListener("DOMContentLoaded", async () => {
      const button = document.getElementById("button");
      const result = document.getElementById("result");
      console.log('result TextArea',result);
      const main = document.getElementById("main");
      let listening = false;
      let lastResult = "";
      this.displayConversation(this.conversation);
      const SpeechRecognition = this.window.SpeechRecognition || this.window.webkitSpeechRecognition;
      if (typeof SpeechRecognition !== "undefined") {
        const recognition = new SpeechRecognition();
        const stop = () => {
          main!.classList.remove("speaking");
          recognition.stop();
        };
        const start = () => {
          recognition.lang = this.lang;
          if (this.initialAudio) {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              // Check if the user has already granted microphone access
              navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
                // The user has already granted microphone access
                // Stop the stream from being recorded (we only needed to check the permission)
                stream.getTracks().forEach(function (track) {
                  track.stop();
                });
                const result = document.getElementById("result");
                const main = document.getElementById("main");
                main!.classList.add("speaking");
                recognition.start();
                result!.textContent = "";
              }).catch(function (error) {
                // The user has not granted microphone access
              });
            } else {
            }
          } else {
            main!.classList.add("speaking");
            recognition.start();
            result!.textContent = "";
          }
        };

        const onResult = (event: any) => {
          result!.innerHTML = "";
          for (const res of event.results) {
            lastResult = res[0].transcript;
            result!.textContent = res[0].transcript;
            $("#result").val(res[0].transcript);
          }
        };

        const end = (event: any) => {
          this.appendMessage_tt(lastResult);
          let desktopSafari = !navigator.userAgent.match(/(iPod|iPhone|iPad)/) && this.isAppleSafari();
          if (!desktopSafari) {
            setTimeout(()=> {
              this.completeTranscript(lastResult);
            }, 950);
            stop();
            listening = false;
          }
          result!.textContent = "";
          $("#result").val("");
        };
        recognition.addEventListener("end", end);
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.addEventListener("result", onResult);
        button!.addEventListener("click", event => {
          let desktopSafari = !navigator.userAgent.match(/(iPod|iPhone|iPad)/) && this.isAppleSafari();
          if (!desktopSafari) {
            if (!listening) { start(); listening = true;
            }
          } else {
            if (listening) { stop(); window.setTimeout(this.completeTranscript, 950, lastResult);
              start();
            }
            listening = !listening;
          }
        });
      }
    });
  }
  appendMessage_tt(text: any, send = true, scroll = true) {
    const classname = send ? 'd-flex justify-content-end mb-4' : 'd-flex justify-content-start mb-4';
    const containerClass = send ? 'msg_cotainer_send' : 'msg_cotainer';
    let time =  ""
    const message = `<div class="${classname}">
                    <div class="${containerClass}">${text}
                    <span class="msg_time_send">${time}</span></div></div>`;
    if (this.messages.nativeElement.querySelectorAll('.ticontainer').length <= 0) {
      this.messages.nativeElement.innerHTML += message;
    } else {
      $('.ticontainer').replaceWith(`${text}`);
    }
    if (scroll) {
      this.scrollSmoothlyToBottom("messages");
    }
  }

  appendMessage_history(text: any, send = true, scroll = true) {
    if ($('.ticontainer').length <= 0) {
      $("#messages").append(`<div class="d-flex justify-content-${send ? "end" : "start"} mb-4">
<div class="msg_cotainer${send ? "_send" : ""}">${text}<span class="msg_time_send">8:55 AM, Today</span></div>`);
    } else {
      $('.ticontainer').replaceWith(`${text}`);
    }
    if (scroll)
      this.scrollSmoothlyToBottom("messages");
  }
  handleEnterPress(event: any, value: any) {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      if (value.length > 0) {
        this.appendMessage_tt(value);
        setTimeout(() => this.completeTranscript(value), 5);
        this.resultTextarea.nativeElement.value = "";
        this.resultTextarea.nativeElement.blur();
      }
    }
  }

  isAppleSafari = () => {
    return (this.appleExpression.test(navigator.vendor) &&
      this.safariExpression.test(navigator.userAgent));
  }

  displayConversation(conversation: any) {
    conversation.forEach((item:any) => {
      const sendMessage = item.input;
      const receivedMessage = item.output;
      if (sendMessage.length > 0)
        this.appendMessage_tt(sendMessage, true, false);
      this.appendMessage_tt(receivedMessage, false, false);
    });
    this.scrollToBottom("messages");
  }

  scrollSmoothlyToBottom = (id: any) => {
    const element = $(`#${id}`);
    element.animate({
      scrollTop: element.prop("scrollHeight")
    }, 500);
  }

  scrollToBottom = (id: any) => {
    const element = document.getElementById(id);
    element!.scrollTop = element!.scrollHeight;
  }

  appendMessage(text: any, send = true, scroll = true) {
    let messages = document.getElementById("messages") as HTMLTextAreaElement;
    let div = document.createElement("div");
    div.innerHTML = "This is my div elementtttttAAAAAAAAAAAAAAA";
    messages.value += div.outerHTML;
  }



  loader(element: any) {
    element.textContent = ''
    this.loadInterval = setInterval(() => {
      // Update the text content of the loading indicator
      element.textContent += '.';
      // If the loading indicator has reached three dots, reset it
      if (element.textContent === '....') {
        element.textContent = '';
      }
    }, 300);
  }

  async completeTranscript(transcript: any) {
    console.log('transcripttttt update 333333',transcript)
     this.appendMessage_tt('<div class="ticontainer"><div class="tiblock"><div class="tidot"></div></div></div>', false);
    const cardBody = document.querySelector('.card-body');
    cardBody!.scrollTop = cardBody!.scrollHeight;
    let character = this.getCharacterOrEmpty();
    let completedText = await this.completeText(transcript, this.conversation, character);
    completedText = completedText.replace(/"/g, "");
    if (completedText.length > 0) {
      this.appendMessage_tt(completedText, false);
      let turn = {
        input: transcript,
        output: completedText
      }
      this.conversation.push(turn);
      localStorage.setItem(this.historyKey, JSON.stringify(this.conversation));
      this.speakRemote(completedText, character);
    }
  }

  completeTranscript_NgVersion(transcript: string) {
    const cardBody = document.querySelector('.card-body');
    cardBody!.scrollTop = cardBody!.scrollHeight;
    let character = ""//this.getCharacterOrEmpty();
    this.completeText(transcript, this.conversation, character)
      .then(completedText => {
        completedText = completedText.replace(/"/g, "");
        if (completedText.length > 0) {
          this.appendMessage_tt(completedText, false);
          let turn = {
            input: transcript,
            output: completedText
          }
          this.conversation.push(turn);
          localStorage.setItem(this.historyKey, JSON.stringify(this.conversation));
          this.speakRemote(completedText, character);
        }
      });
  }

  activateAudio() {
    this.speakAudio.muted = false;
    this.speakAudio.src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
  }

  readOutWords(words: any) {
    if(this.volume) {
      const utterance = new SpeechSynthesisUtterance(words);
      utterance.rate = 1;
      utterance.pitch = 0.85;
      this.synth.speak(utterance);
    }
  }

  async speakRemote(text: any, character='') {
    this.unlock();
    this.speakAudio.muted = false;
    const sentenceRegex = /([A-Z][^\.!?`]*[\.!?`])/g;
    const sentencesInString = text.match(sentenceRegex);
    if (sentencesInString) {
      sentencesInString.forEach((sentence: string) => {
        sentence = sentence.replace(/`/g, '');
        if (!this.lastSentences.includes(sentence)) {
          this.readOutWords(sentence)
          this.lastSentences.push(sentence);
          if (this.lastSentences.length > 50) {
            this.lastSentences.shift();
          }
        }
      });
    }
    $("#result").val("");
  }

  unlock() {
    var buffer = this.context.createBuffer(1, 1, 22050);
    var source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
  }

  async completeText(transcript: any, conversation: any, character='') {
    let response: Response = new Response();
    try {
      response = await fetch('https://askserver.onrender.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "conversation": prompt,
          "prompt": transcript,
          "character": character,
        })
      });
    } catch (error) {
      console.error(error);
      this.appendMessage("That model is currently overloaded with other requests. You can retry your request.", false);
    }

    if(response && response.ok){
      let data = await response.json();
      return data['bot'];
    } else{
      this.appendMessage("That model is currently overloaded with other requests. You can retry your request.", false);
      return "";
    }
  }

  toggleVolume(){
    this.volume = !this.volume;
    localStorage.setItem("volume", JSON.stringify(this.volume));
    $('#volume').toggleClass("fa-volume-down fa-volume-mute");
  }

  clearConversation() {
    this.conversation = [];
    localStorage.setItem(this.historyKey, JSON.stringify(this.conversation));
    $("#messages").empty();
  }

  getCharacterOrEmpty(){
    const currentUrl = window.location.href;
    if (currentUrl.startsWith('https://AskMe/?@')) {
      // Split the url by '/' to get the parts of the url
      const urlParts = currentUrl.split('/');
      // The character name will be the third part of the url (assuming that the url is in the format https://AskMe/@Prompt)
      const characterName = decodeURIComponent(urlParts[3]).replace(/[^A-Za-z0-9\u00C0-\u017F\.\,\!\:\-\_\s]/g, "");
      // Return the character name
      return characterName;
    }
    else {
      return '';
    }
  }

  hasCharacter(){
    return (this.getCharacterOrEmpty() !== '');
  }

  async detectLanguage() {
    fetch('https://www.cloudflare.com/cdn-cgi/trace')
      .then(response => response.text())
      .then(data => {
        try {
          const lines = data.split('\n');
          //const country_code = lines.find(line => line.startsWith('loc=')).split('=')[1];
          const country_code = lines.find(line => line?.startsWith('loc='))?.split('=')[1];
          if (!this.urlParams.has('prompt') && !this.hasCharacter()) {
            if (country_code == "US") {
              this.lang = "en-US";
            } else if (country_code == "DE") {
              this.lang = "de-DE";
            }
            else if (country_code == "FR") {
              this.lang = "fr-FR";
            }
            else if (country_code == "ES") {
              this.lang = "es-ES";
            } else {
              this.lang = "en-US";
            }
          }
        } catch (error) {
          console.error(error);
          this.lang = "en-US";
        }

      })
      .catch(error => { console.error(error); this.lang = "en-US"; });
  }
  toggleActionMenu() {
    this.showActionMenu = !this.showActionMenu;
  }
}

