import SoundboxLoaderInterface from "../interfaces/SoundboxLoaderInterface";
import SoundboxNameProviderInterface from "../interfaces/SoundboxNameProviderInterface";
import Constants from "../model/Constants";
import { EventTypes } from "../model/EventTypes";
import Sound from "../model/Sound";
import SoundboxConfig from "../model/SoundboxConfig";
import { EventEmitter, EventEmitterCallback } from "./EventEmitter";
import SoundboxNameProvider from "./SoundboxNameProvider";

export default class SoundboxLoaderService implements SoundboxLoaderInterface {

    private soundboxConfig: SoundboxConfig | undefined = undefined;
    private mapAudio: Map<string, HTMLAudioElement> = new Map();
    private preloadedImages: string[] = [];
    private eventEmitter: EventEmitter = new EventEmitter();
    private soundboxNameProvider: SoundboxNameProviderInterface = new SoundboxNameProvider();

    async loadConfig(): Promise<void> {
        const url = Constants.CONFIG_URI.replace(Constants.MEME_NAME_PLACEHOLDER, this.soundboxNameProvider.getSoundboxName());

        try {
            const config = await fetch(url);
            this.soundboxConfig = await config.json();
            this.eventEmitter.emit(EventTypes.LOADED_CONFIG);
        } catch(error) {
            console.error(`Error loading config at ${url}:`, error);
            this.eventEmitter.emit(EventTypes.ERROR_LOADING_CONFIG);
        }
    }

    async getConfig(): Promise<SoundboxConfig | undefined> {
        if (!this.soundboxConfig) {
            await this.loadConfig();
        }

        return this.soundboxConfig;
    }

    async loadSounds(sounds: Sound[]): Promise<void> {
        const totalSounds = sounds.length;
        let loadedSounds = 0;

        for (const sound of sounds) {
            if (sound.soundURL && !this.mapAudio.has(sound.soundURL)) {
                try {
                    const audio = await this.loadAudio(sound.soundURL);
                    loadedSounds++;
                    this.mapAudio.set(sound.soundURL, audio);
                    this.eventEmitter.emit(EventTypes.LOADED_AUDIO, { loaded: loadedSounds, total: totalSounds, url: sound.soundURL });
                } catch (error) {
                    console.error(`Error loading audio at ${sound.soundURL}:`, error);
                    this.eventEmitter.emit(EventTypes.ERROR_LOADING_AUDIO, { url: sound.soundURL });
                }
            }
        }

        this.eventEmitter.emit(EventTypes.LOADED_ALL_AUDIO);
    }

    private async loadAudio(url: string): Promise<HTMLAudioElement> {
        const audio = await fetch(url);
        const audioBlob = await audio.blob();
        return new Audio(URL.createObjectURL(audioBlob));
    }

    async loadImages(imageURLs: string[]): Promise<void> {
        const totalImages = imageURLs.length;
        let loadedImages = 0;

        for (const url of imageURLs) {
            if (!this.preloadedImages.includes(url)) {
                try {
                    await this.loadImage(url);
                    this.preloadedImages.push(url);
                    loadedImages++;
                    this.eventEmitter.emit(EventTypes.LOADED_IMAGE, { loaded: loadedImages, total: totalImages, url });
                } catch (error) {
                    console.error(`Error loading image at ${url}:`, error);
                    this.eventEmitter.emit(EventTypes.ERROR_LOADING_IMAGE, { url });
                }
            }
        }

        this.eventEmitter.emit(EventTypes.LOADED_ALL_IMAGES);
    }

    private async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const imageElement = new Image();

            imageElement.addEventListener("load", () => {
                resolve(imageElement);
            });

            imageElement.addEventListener("error", (event) => {
                reject(event.error || new Error("Unknown image loading error"));
            });

            imageElement.src = url;
        });
    }

    async getAudioByUrl(url: string): Promise<HTMLAudioElement | undefined> {
        let audioElement = this.mapAudio.get(url);

        if (!audioElement) {
            try {
                audioElement = await this.loadAudio(url);
                this.mapAudio.set(url, audioElement);
            } catch (error) {
                console.error(`Error loading audio at ${url}:`, error);
                this.eventEmitter.emit(EventTypes.ERROR_LOADING_AUDIO, { url });
                return undefined;
            }
        }

        return audioElement;
    }

    async getBlobByUrl(url: string): Promise<Blob | undefined> {
        const audioElement = this.mapAudio.get(url);

        if (audioElement) {
            const data = await fetch(audioElement.src);
            return await data.blob();
        }

        return undefined;
    }

    onAudioLoaded(callback: EventEmitterCallback): void {
        this.eventEmitter.on(EventTypes.LOADED_AUDIO, callback);
    }

    onAllAudioLoaded(callback: EventEmitterCallback): void {
        this.eventEmitter.on(EventTypes.LOADED_ALL_AUDIO, callback);
    }

    onErrorLoadingAudio(callback: EventEmitterCallback): void {
        this.eventEmitter.on(EventTypes.ERROR_LOADING_AUDIO, callback);
    }

    onImageLoaded(callback: EventEmitterCallback): void {
        this.eventEmitter.on(EventTypes.LOADED_IMAGE, callback);
    }

    onErrorLoadingImage(callback: EventEmitterCallback): void {
        this.eventEmitter.on(EventTypes.ERROR_LOADING_IMAGE, callback);
    }

    onLoadedAllImages(callback: EventEmitterCallback): void {
        this.eventEmitter.on(EventTypes.LOADED_ALL_IMAGES, callback);
    }

    onErrorLoadingConfig(callback: EventEmitterCallback): void {
        this.eventEmitter.on(EventTypes.ERROR_LOADING_CONFIG, callback);
    }

    onLoadedConfig(callback: EventEmitterCallback): void {
        this.eventEmitter.on(EventTypes.LOADED_CONFIG, callback);
    }
}
