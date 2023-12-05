import { Client, REST, Routes, ChannelType } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable "${key}" is not defined.`);
    }
    return defaultValue;
  }
  return value;
}

const token = getEnv("DISCORD_TOKEN");
const appId = getEnv("DISCORD_APP_ID");
const guildId = getEnv("DISCORD_GUILD_ID");

const rest = new REST({ version: "10" }).setToken(token);
const client = new Client({
  intents: ["Guilds"],
});

const commands = [
  new SlashCommandBuilder()
    .setName("join")
    .setDescription("カテゴリにユーザーを追加")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("追加するユーザー")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(appId, guildId), {
      body: commands,
    });
  } catch (error) {
    console.error(error);
  }
})();

client.on("ready", () => {});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    if (interaction.commandName === "join") {
      const user = interaction.options.getUser("user", true);
      if (user.bot) {
        await interaction.reply({
          content: "botは対象外です。",
          ephemeral: true,
        });
        return;
      }

      const channel = interaction.channel;
      if (channel === null || channel.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: "チャンネル取得に失敗しました",
          ephemeral: true,
        });
        return;
      }
      const category = channel.parent;
      if (category === null) {
        await interaction.reply({
          content: "カテゴリが見つかりませんでした。",
          ephemeral: true,
        });
        return;
      }

      const everyoneOverwrite = category.permissionOverwrites.cache.find(
        (overwrite) => overwrite.id === channel.guild.roles.everyone.id
      );
      if (
        everyoneOverwrite === undefined ||
        !everyoneOverwrite.deny.has("ViewChannel")
      ) {
        await interaction.reply({
          content: "このカテゴリは対象外です。",
          ephemeral: true,
        });
        return;
      }

      const overwrite = category.permissionOverwrites.cache.find(
        (overwrite) => overwrite.id === user.id
      );

      if (overwrite !== undefined) {
        await interaction.reply({
          content: "既にカテゴリに追加されています。",
          ephemeral: true,
        });
        return;
      }

      await category.permissionOverwrites.create(user, {
        ViewChannel: true,
      });
      await interaction.reply({
        content: `<@${user.id}>をカテゴリに追加しました。`,
      });
    }
  }
});

client.login(token);
