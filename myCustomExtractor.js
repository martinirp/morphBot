const { ExtractorPlugin } = require('distube');
const ytsr = require('ytsr');
const ytdlp = require('@distube/yt-dlp');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Carrega variáveis de ambiente do .env

class MyCustomExtractor extends ExtractorPlugin {
    constructor(options) {
        super(options);
        this.ytdlp = ytdlp;
        this.ytsr = ytsr;
        this.driver = null;
        this.cookiesPath = path.join(__dirname, '..', 'data', 'cookies.json');
        console.log('MyCustomExtractor initialized');
    }

    // Método para fazer login no YouTube via Selenium
    async loginWithSelenium() {
        if (fs.existsSync(this.cookiesPath)) {
            console.log('Cookies already exist, skipping login');
            return;
        }

        console.log('Starting login with Selenium...');
        try {
            // Criação do driver do Chrome
            const options = new chrome.Options();
            options.addArguments('headless'); // Rodar o Chrome sem interface gráfica
            this.driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

            // Acesse o YouTube
            await this.driver.get('https://www.youtube.com');
            
            // Espera até o botão de login aparecer
            const loginButton = await this.driver.wait(until.elementLocated(By.css('ytd-button-renderer.style-scope.ytd-masthead')), 10000);
            await loginButton.click();
            
            // Espera pela página de login carregar
            await this.driver.wait(until.elementLocated(By.css('input[type="email"]')), 10000);
            
            // Preencher o email com a variável de ambiente
            const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
            await emailInput.sendKeys(process.env.GOOGLE_EMAIL); // Usando o e-mail do .env
            await this.driver.findElement(By.css('#identifierNext')).click();
            
            // Espera a página de senha carregar
            await this.driver.wait(until.elementLocated(By.css('input[type="password"]')), 10000);
            
            // Preencher a senha com a variável de ambiente
            const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
            await passwordInput.sendKeys(process.env.GOOGLE_PASSWORD); // Usando a senha do .env
            await this.driver.findElement(By.css('#passwordNext')).click();

            // Aguarda a página principal carregar após o login
            await this.driver.wait(until.elementLocated(By.css('ytd-masthead')), 10000);
            console.log('Login successful');

            // Salvar os cookies após o login
            const cookies = await this.driver.manage().getCookies();
            fs.writeFileSync(this.cookiesPath, JSON.stringify(cookies));
        } catch (error) {
            console.error('Erro no login com Selenium:', error);
        } finally {
            if (this.driver) {
                await this.driver.quit();
            }
        }
    }

    async validate(url) {
        console.log(`Validating URL: ${url}`);
        return (
            url.startsWith('https://') ||
            url.includes('youtube.com') ||
            url.includes('youtu.be')
        );
    }

    async extract(url) {
        console.log(`Extracting from URL: ${url}`);
        try {
            await this.loginWithSelenium(); // Garantir que o login foi feito antes de extrair o conteúdo
            if (fs.existsSync(this.cookiesPath)) {
                const cookies = JSON.parse(fs.readFileSync(this.cookiesPath));
                await this.ytdlp.setCookies(cookies); // Usar os cookies carregados
            }

            const info = await this.ytdlp.getInfo(url, {
                cookies: this.cookiesPath // Passando o caminho dos cookies
            });
            return {
                name: info.title,
                url: info.webpage_url,
                thumbnail: info.thumbnail,
                duration: info.duration,
            };
        } catch (error) {
            console.error('Error extracting info:', error);
            throw error;
        }
    }

    async search(query) {
        console.log(`Searching for query: ${query}`);
        try {
            const results = await ytsr(query, { limit: 1 });
            const video = results.items.find((item) => item.type === 'video');
            return video
                ? {
                    name: video.title,
                    url: video.url,
                    thumbnail: video.thumbnail,
                    duration: null, // Duração pode ser obtida adicionalmente com yt-dlp se necessário
                }
                : null;
        } catch (error) {
            console.error('Error searching for video:', error);
            throw error;
        }
    }

    async resolve(query) {
        console.log(`Resolving query: ${query}`);
        // Primeiro tenta extrair como URL
        if (await this.validate(query)) {
            return await this.extract(query);
        }

        // Caso não seja uma URL, tenta buscar por string
        return await this.search(query);
    }
}

module.exports = MyCustomExtractor;
