import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "assert-bot";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Guia completo de como usar o bot Assert."),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Assert - Guia Completo")
      .setDescription(
        "Um bot de Discord para simulações intensas de equipes de TI em cenários corporativos, focado no desenvolvimento de habilidades de comunicação assertiva sob pressão.",
      )
      .setColor(0x0099ff)
      .addFields(
        {
          name: "Comandos Disponíveis",
          value: "**/criar-sessao** - Inicia a formação de uma nova sessão\n" +
            "**/iniciar-sessao** - Inicia a sessão com os participantes atuais\n" +
            "**/encerrar-sessao** - Encerra uma sessão ativa ou em formação\n" +
            "**/help** - Exibe este guia de ajuda",
        },
        {
          name: "Como Participar de uma Sessão",
          value: "1. **Criação**: Use `/criar-sessao` no canal principal\n" +
            "2. **Participação**: Outros usuários clicam nos botões da mensagem para entrar\n" +
            "3. **Início**: O dono da sessão usa `/iniciar-sessao` quando pronto\n" +
            "4. **Configuração**: Canais privados são criados automaticamente\n" +
            "5. **Distribuição**: Personagens e cenários são enviados via DM",
        },
        {
          name: "Interagindo com NPCs",
          value:
            "Durante a sessão, mencione NPCs usando `@` seguido do primeiro nome do personagem (ex: `@Fulano`) para receber respostas contextualizadas baseadas no cenário.",
        },
        {
          name: "Sistema de Feedback",
          value: "Após encerrar uma sessão:\n" +
            "• Todos os participantes recebem um formulário de feedback anônimo\n" +
            "• Feedback é entregue diretamente aos usuários via DM\n" +
            "• Uma avaliação geral da sessão é gerada automaticamente",
        },
        {
          name: "Gerenciamento de Tempo",
          value: "• Sessões em formação expiram após 1 hora\n" +
            "• Canais de sessão ativa são automaticamente deletados 1 hora após o encerramento\n" +
            "• Feedback deve ser fornecido dentro de 1 hora após o término da sessão",
        },
      );

    await interaction.editReply({
      embeds: [embed],
    });
  },
};

export default command;
