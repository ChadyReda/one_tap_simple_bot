require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});


client.commands = {
  prefix: new Collection(),
  slash: new Collection()
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️ Directory not found: ${dirPath}`)
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`📁 Created directory: ${dirPath}`)
    return false
  }
  return true
}


const loadEvents = () => {
  const eventsPath = path.join(__dirname, 'events')

  if (!ensureDirectoryExists(eventsPath)) return

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'))

  eventFiles.forEach(file => {
    const event = require(path.join(eventsPath, file))
    const executor = (...args) => event.execute(...args, client)
    event.once ? client.once(event.name, executor) : client.on(event.name, executor)
  })
};


// Load commands with validation
const loadCommands = (type) => {
  const commandsPath = path.join(__dirname, 'commands', type);
  if (!ensureDirectoryExists(commandsPath)) return;

  try {
    const commandFiles = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.js'));

    commandFiles.forEach(file => {
      try {
        const command = require(path.join(commandsPath, file));
        const key = type === 'slash' ? command.data.name : command.name;
        client.commands[type].set(key, command);
      } catch (error) {
        return
      }
    });
  } catch (error) {
    return
  }
};


const initialize = async () => {
  try {
    // Create necessary directories if missing
    ensureDirectoryExists(path.join(__dirname, 'commands'));
    ensureDirectoryExists(path.join(__dirname, 'events'));
    
    loadEvents();
    ['prefix', 'slash'].forEach(loadCommands);
    
    await client.login(process.env.TOKEN);
    console.log('S - init')
  } catch (error) {
    console.error('F - init');
    console.log(error)
    process.exit(1);
  }
};

initialize();