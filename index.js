
const http = require('http');

const {
  Client,
  GatewayIntentBits,
  Events,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

// ==============================
// CONFIG
// ==============================

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1549091749966647336';
const OWNER_ID = '1549087398032445450';
const TICKET_CATEGORY_ID = '1549100309412843694';

const PORT = process.env.PORT || 10000;

if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN is missing!');
  process.exit(1);
}

// ==============================
// DISCORD CLIENT
// ==============================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ==============================
// RENDER WEB SERVER
// ==============================

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  res.end('❄️ CursedFrozen Support is running!');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Web server error:', error);
});

// ==============================
// TICKET CATEGORIES
// ==============================

const categories = [
  { label: 'General Support', value: 'general', emoji: '🛠️' },
  { label: 'Player Report', value: 'report', emoji: '🚨' },
  { label: 'Bug Report', value: 'bug', emoji: '🐛' },
  { label: 'Store / Purchase', value: 'store', emoji: '💎' },
  { label: 'Ban Appeal', value: 'appeal', emoji: '🔨' }
];

// ==============================
// SLASH COMMAND REGISTER
// ==============================

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`❄️ Online: ${readyClient.user.tag}`);

  const command = new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Post the CursedFrozen support panel');

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        readyClient.user.id,
        GUILD_ID
      ),
      {
        body: [command.toJSON()]
      }
    );

    console.log('✅ Ticket command registered!');
  } catch (error) {
    console.error('❌ Command registration error:', error);
  }
});

// ==============================
// INTERACTION HANDLER
// ==============================

client.on(Events.InteractionCreate, async (interaction) => {
  try {

    // ==========================
    // TICKET PANEL
    // ==========================

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== 'ticketpanel') return;

      if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({
          content: '❌ Only the Owner can use this command.',
          ephemeral: true
        });
      }

      const panel = new EmbedBuilder()
        .setColor('#79CFFF')
        .setTitle('❄️ CURSEDFROZEN SUPPORT')
        .setDescription(
          '**Welcome to CursedFrozen SMP Support Center!**\n\n' +
          'Need help? Select a category below to create your private ticket.\n\n' +
          '🛠️ General Support\n' +
          '🚨 Player Report\n' +
          '🐛 Bug Report\n' +
          '💎 Store / Purchase\n' +
          '🔨 Ban Appeal\n\n' +
          '🎫 One active ticket per player.\n\n' +
          '━━━━━━━━ **SUPPORT** ━━━━━━━━'
        )
        .setFooter({
          text: 'CursedFrozen SMP • Support Center'
        });

      const menu = new StringSelectMenuBuilder()
        .setCustomId('ticket_category')
        .setPlaceholder('❄️ Select your ticket category')
        .addOptions(
          categories.map(category => ({
            label: category.label,
            value: category.value,
            emoji: category.emoji
          }))
        );

      await interaction.reply({
        embeds: [panel],
        components: [
          new ActionRowBuilder().addComponents(menu)
        ]
      });

      return;
    }

    // ==========================
    // CATEGORY SELECTION
    // ==========================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === 'ticket_category'
    ) {
      await interaction.deferReply({
        ephemeral: true
      });

      const guild = interaction.guild;
      const user = interaction.user;

      if (!guild) {
        return interaction.editReply({
          content: '❌ Server not found.'
        });
      }

      // Check ticket category
      const ticketCategory = await guild.channels.fetch(
        TICKET_CATEGORY_ID
      );

      if (
        !ticketCategory ||
        ticketCategory.type !== ChannelType.GuildCategory
      ) {
        return interaction.editReply({
          content: '❌ Ticket category not found. Please check the Category ID.'
        });
      }

      // Check existing tickets
      const channels = await guild.channels.fetch();

      const existing = channels.find(channel =>
        channel &&
        channel.type === ChannelType.GuildText &&
        channel.parentId === TICKET_CATEGORY_ID &&
        channel.topic?.includes(`creatorId:${user.id}`)
      );

      if (existing) {
        return interaction.editReply({
          content: `❄️ You already have an active ticket: ${existing}`
        });
      }

      const category = categories.find(
        item => item.value === interaction.values[0]
      );

      if (!category) {
        return interaction.editReply({
          content: '❌ Invalid ticket category.'
        });
      }

      const safeName = user.username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 20);

      // Create private ticket
      const channel = await guild.channels.create({
        name: `ticket-${safeName}`,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID,

        topic:
          `CursedFrozen ticket | creatorId:${user.id} | type:${category.value}`,

        permissionOverwrites: [
          {
            id: guild.id,
            deny: [
              PermissionFlagsBits.ViewChannel
            ]
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks
            ]
          },
          {
            id: OWNER_ID,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels
            ]
          }
        ]
      });

      // Ticket embed
      const ticketEmbed = new EmbedBuilder()
        .setColor('#79CFFF')
        .setTitle(`${category.emoji} CursedFrozen Support`)
        .setDescription(
          `Hello ${user}!\n\n` +
          `Your **${category.label}** ticket has been created.\n` +
          'Please explain your issue. The Owner will assist you.\n\n' +
          '❄️ Thank you for contacting CursedFrozen SMP!'
        )
        .setFooter({
          text: 'CursedFrozen • Private Support'
        });

      // Close button
      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger);

      await channel.send({
        content: `${user} <@${OWNER_ID}>`,
        embeds: [ticketEmbed],
        components: [
          new ActionRowBuilder().addComponents(closeButton)
        ]
      });

      // Confirmation
      await interaction.editReply({
        content: `✅ Your ticket is ready: ${channel}`
      });

      // Delete confirmation after 5 seconds
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {
          console.error('Confirmation delete error:', error);
        }
      }, 5000);

      return;
    }

    // ==========================
    // CLOSE TICKET
    // ==========================

    if (
      interaction.isButton() &&
      interaction.customId === 'close_ticket'
    ) {
      const channel = interaction.channel;

      const creatorId = channel.topic
        ?.match(/creatorId:(\d+)/)?.[1];

      if (
        interaction.user.id !== OWNER_ID &&
        interaction.user.id !== creatorId
      ) {
        return interaction.reply({
          content: '❌ You cannot close this ticket.',
          ephemeral: true
        });
      }

      await interaction.reply({
        content: '🔒 Ticket closed! This channel will be deleted in 5 seconds.'
      });

      setTimeout(async () => {
        try {
          await channel.delete(
            'CursedFrozen ticket closed'
          );
        } catch (error) {
          console.error('Ticket delete error:', error);
        }
      }, 5000);

      return;
    }

  } catch (error) {
    console.error('❌ Ticket error:', error);

    if (
      interaction.isRepliable() &&
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.reply({
        content: '❌ Something went wrong. Please try again.',
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// ==============================
// DISCORD ERROR HANDLING
// ==============================

client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

// ==============================
// LOGIN
// ==============================

client.login(TOKEN).catch(error => {
  console.error('❌ Discord login failed:', error);
  process.exit(1);
});
