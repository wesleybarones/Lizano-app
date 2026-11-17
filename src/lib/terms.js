/*
 * Termos de Uso e Política de Privacidade (LGPD) do app de consignado.
 * Ao alterar o texto, troque TERMS_VERSION: todas as revendedoras
 * precisarão aceitar de novo no próximo acesso.
 */
export const TERMS_VERSION = '2026-11-16';
export const TERMS_DATE = '16/11/2026';

// {brand} é trocado pelo nome da empresa (ex.: Lizano)
export const TERMS = [
  {
    title: 'Termos de Uso',
    sections: [
      {
        h: '1. Sobre o app',
        p: [
          'Este app é usado pela {brand} e pelas suas revendedoras para controlar o consignado de semijoias: as peças de cada maleta, as vendas marcadas, as comissões, os bônus e os acertos.',
          'O app não movimenta dinheiro. Pagamentos e recebimentos acontecem fora dele, combinados diretamente entre você e a {brand}. Os valores mostrados servem para controle.',
        ],
      },
      {
        h: '2. Seu acesso',
        p: [
          'O acesso é pessoal e intransferível. Você entra com o celular ou e-mail e a senha criados pela {brand}. Guarde sua senha e não a compartilhe; você pode trocá-la a qualquer momento na tela de perfil.',
          'A {brand} pode suspender ou encerrar o acesso, por exemplo, ao fim da parceria.',
        ],
      },
      {
        h: '3. Suas responsabilidades',
        list: [
          'Marcar como vendidas somente as peças que você realmente vendeu.',
          'Cuidar das peças da maleta enquanto estiverem com você e devolver as não vendidas no acerto.',
          'Usar o app apenas para a parceria com a {brand}.',
        ],
      },
      {
        h: '4. Valores, comissão e bônus',
        p: [
          'Preços, percentual de comissão, metas e bônus são definidos pela {brand} e podem ser diferentes para cada revendedora. O valor de cada acerto é calculado pelo app com base nas vendas marcadas e pode ser ajustado pela {brand} no fechamento do acerto.',
        ],
      },
      {
        h: '5. Alterações',
        p: [
          'Estes termos podem ser atualizados. Quando isso acontecer, o app pedirá que você leia e aceite a nova versão para continuar usando.',
        ],
      },
    ],
  },
  {
    title: 'Política de Privacidade (LGPD)',
    sections: [
      {
        h: '1. Quem cuida dos seus dados',
        p: [
          'A {brand} é a controladora dos seus dados pessoais, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018). A Barones Labs, que desenvolve e mantém o app, trata os dados em nome da {brand}, assim como os serviços de banco de dados (Supabase) e de hospedagem (Vercel) usados para o app funcionar.',
        ],
      },
      {
        h: '2. Quais dados usamos',
        list: [
          'Identificação e acesso: nome, celular e/ou e-mail e senha (guardada de forma criptografada; ninguém consegue ver sua senha).',
          'Dados da parceria: maletas, peças, vendas marcadas, comissões, bônus, metas e acertos.',
          'Dados técnicos de acesso: data e hora de login e informações do aparelho e da conexão registradas automaticamente para segurança.',
        ],
      },
      {
        h: '3. Para que usamos',
        list: [
          'Permitir seu acesso ao app.',
          'Controlar as maletas, vendas, comissões, bônus e acertos da parceria.',
          'Gerar os relatórios usados pela {brand} na gestão do negócio.',
          'Manter a segurança do app e prevenir acessos indevidos.',
        ],
        p: [
          'Esse uso se baseia na execução da parceria entre você e a {brand} e no legítimo interesse de manter o controle e a segurança do consignado (art. 7º, incisos V e IX, da LGPD).',
        ],
      },
      {
        h: '4. Com quem compartilhamos',
        p: [
          'Seus dados não são vendidos nem usados para propaganda. Eles são acessados apenas pela {brand}, pela Barones Labs e pelos serviços técnicos citados acima, somente para o funcionamento do app, ou quando houver obrigação legal ou ordem de autoridade.',
          'O banco de dados fica no Brasil (São Paulo).',
        ],
      },
      {
        h: '5. Por quanto tempo',
        p: [
          'Os dados ficam guardados enquanto durar a parceria e, depois, pelo tempo necessário para cumprir obrigações legais e para a {brand} poder comprovar os acertos realizados. Depois disso, são apagados ou tornados anônimos.',
        ],
      },
      {
        h: '6. Seus direitos',
        p: [
          'Você pode, a qualquer momento, pedir à {brand}: confirmação de que tratamos seus dados, acesso a eles, correção de dados incompletos ou errados, anonimização ou eliminação de dados desnecessários, portabilidade, informação sobre com quem compartilhamos e a revisão deste aceite (art. 18 da LGPD).',
          'Para exercer seus direitos ou tirar dúvidas, fale com a {brand} pelo WhatsApp {phone}.',
        ],
      },
      {
        h: '7. Segurança',
        p: [
          'Usamos conexão criptografada, senhas protegidas e regras de acesso que garantem que cada revendedora veja apenas os próprios dados. Avise a {brand} imediatamente se suspeitar que alguém usou o seu acesso.',
        ],
      },
    ],
  },
];

