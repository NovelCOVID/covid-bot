const Discord = require('discord.js'),
  api = require('covidapi'),
	moment = require('moment'),
  { CanvasRenderService } = require('chartjs-node-canvas')

const setup = (ChartJS) => {
  ChartJS.defaults.global.defaultFontColor='#fff'
  ChartJS.defaults.global.defaultFontStyle='bold'
  ChartJS.defaults.global.defaultFontFamily='Helvetica Neue, Helvetica, Arial, sans-serif'
  ChartJS.plugins.register({
    beforeInit: function(chart){
      chart.legend.afterFit = function() { this.height += 35 }
    },
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = '#2F3136';
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    }
  })
}
  
const lineRenderer = new CanvasRenderService(1200, 600, setup)
const pieRenderer = new CanvasRenderService(700, 600, setup)
const sortables = { 'cases': null, 'deaths': null, 'active': null, 'recovered': null, 'todaycases': 'todayCases', 'todaydeaths': 'todayDeaths', 'critical': null, 'tests': null, 'testsperonemillion': 'testsPerOneMillion', 'deathsperonemillion': 'deathsPerOneMillion', 'casesperonemillion': 'casesPerOneMillion' }

const formatNumber = number => String(number).replace(/(.)(?=(\d{3})+$)/g,'$1,')

const createEmbed = (opts, embed) => new Discord.MessageEmbed(embed)
  .setTitle(opts.title || '')
  .setAuthor(opts.author && opts.author.name || '', opts.author && opts.author.url || '')
  .setDescription(opts.description || '')
  .setThumbnail(opts.thumbnail)
  .setColor(opts.color)
  .attachFiles(opts.files || [])
  .addFields(opts.fields || [])
  .setImage(opts.image || '')
  .setURL(opts.url)
  .setTimestamp()
  .setFooter(opts.footer || '')

const help = async (message, args) => {
  const embed = createEmbed({
    color: '#303136', 
    author: { name: 'COVID Stats by NovelCOVID', url: 'https://cdn.discordapp.com/icons/707227171835609108/f308f34a45ac7644506fb628215a3793.png?size=128' },
    title: `All commands`,
    fields: [
      { name: 'Help', value: '`cov help`\nshows available commands', inline: true },
      { name: 'Invite', value: '`cov invite`\nadd the bot to your own server', inline: true },
      { name: 'All', value: '`cov all`\nshows global COVID stats', inline: true },
      { name: 'Country', value: '`cov country {country} [{log|linear}]`\nshows detailed COVID stats for a country', inline: true },
      { name: 'Graph', value: '`cov graph {country|all}`\nshows a graph with cases, active, deaths and recovered', inline: true },
      { name: 'Overview', value: '`cov overview {country|all}`\nshows an overview chart with active, deaths and recovered', inline: true },
      { name: 'State', value: '`cov state {state}`\nshows detailed COVID stats for a US state', inline: true },
      { name: 'Leaderboard', value: '`cov leaderboard [{property}]`\nshows detailed COVID stats for a US state', inline: true },
      { name: 'Mobility', value: '`cov mobility {country} [{subregion}]`\nshows Apples mobility data in a graph', inline: true },
    ],
    footer: 'React with ❌ to remove this embed.',
    url: 'https://disease.sh'
  })
  const msg = await message.channel.send(embed)
  await msg.react('❌')
  try {
    if (await msg.awaitReactions((reaction, user) => reaction.emoji.name == '❌' && user.id === message.author.id, { max: 1, time: 60000, errors: ['time'] }))
      throw new Error()
  }catch{
    msg.delete()
  }
}

const invite = async message => {
  const embed = createEmbed({
    color: '#303136', 
    author: { name: 'COVID Stats by NovelCOVID', url: 'https://cdn.discordapp.com/icons/707227171835609108/f308f34a45ac7644506fb628215a3793.png?size=128' },
    description: '[Invite](https://discord.com/api/oauth2/authorize?client_id=707564241279909888&permissions=51200&scope=bot "Invite the bot to your server") | [Support Server](https://discord.gg/sszH4C9 "Get help regarding the bot and the API")'
  })
  const msg = await message.channel.send(embed)
  await msg.react('❌')
  try {
    if (await msg.awaitReactions((reaction, user) => reaction.emoji.name == '❌' && user.id === message.author.id, { max: 1, time: 60000, errors: ['time'] }))
      throw new Error()
  }catch{
    msg.delete()
  }
}

const all = async message => {
  const allData = await api.all()
  const yesterdayAllData = await api.yesterday.all()
  allData.todayActives = allData.active - yesterdayAllData.active
  allData.todayRecovereds = allData.recovered - yesterdayAllData.recovered
  allData.todayCriticals = allData.critical - yesterdayAllData.critical
  allData.todayTests = allData.tests - yesterdayAllData.tests
  const embed = createEmbed({
    color: '#303136', 
    author: { name: 'COVID Stats by NovelCOVID', url: 'https://cdn.discordapp.com/icons/707227171835609108/f308f34a45ac7644506fb628215a3793.png?size=128' },
    thumbnail: 'https://i2x.ai/wp-content/uploads/2018/01/flag-global.jpg',
    title: 'Global Data',
    fields: [
      { name: 'Cases', value: `${formatNumber(allData.cases)}\n(${(allData.todayCases >= 0 ? "+":"-")+String(Math.abs(allData.todayCases)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Deaths', value: `${formatNumber(allData.deaths)}\n(${(allData.todayDeaths >= 0 ? "+":"-")+String(Math.abs(allData.todayDeaths)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Active', value: `${formatNumber(allData.active)}\n(${(allData.todayActives >= 0 ? "+":"-")+String(Math.abs(allData.todayActives)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Recovered', value: `${formatNumber(allData.recovered)}\n(${(allData.todayRecovereds >= 0 ? "+":"-")+String(Math.abs(allData.todayRecovereds)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Critical', value: `${formatNumber(allData.critical)}\n(${(allData.todayCriticals >= 0 ? "+":"-")+String(Math.abs(allData.todayCriticals)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Tests', value: `${formatNumber(allData.tests)}\n(${(allData.todayTests >= 0 ? "+":"-")+String(Math.abs(allData.todayTests)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Infection Rate', value: `${(allData.casesPerOneMillion/10000).toFixed(4)} %`, inline: true },
      { name: 'Fatality rate', value: `${(allData.deathsPerOneMillion/10000).toFixed(4)} %`, inline: true },
      { name: 'Test rate', value: `${(allData.testsPerOneMillion/10000).toFixed(4)} %`, inline: true },
      { name: 'Last Updated', value: moment(allData.updated).fromNow(), inline: true }
    ],
    footer: 'React with ❌ to remove this embed.',
    url: 'https://disease.sh'
  })
  const msg = await message.channel.send(embed)
  await msg.react('❌')
  try {
    if (await msg.awaitReactions((reaction, user) => reaction.emoji.name == '❌' && user.id === message.author.id, { max: 1, time: 60000, errors: ['time'] }))
      throw new Error()
  }catch{
    msg.delete()
  }
}

const country = async (message, args) => {
  if (args.length < 1)
    return await message.channel.send('Please specify a country name.')
  const countryData = await api.countries({ country: args[0]})
  const yesterdayCountryData = await api.yesterday.countries({ country: args })
  if(countryData.message || yesterdayCountryData.message) 
    return await message.channel.send(`Could not find '${args[0]}' or it does not have any cases yet.`)
  countryData.todayActives = countryData.active - yesterdayCountryData.active
  countryData.todayRecovereds = countryData.recovered - yesterdayCountryData.recovered
  countryData.todayCriticals = countryData.critical - yesterdayCountryData.critical
  countryData.todayTests = countryData.tests - yesterdayCountryData.tests
  const embed = createEmbed({
    color: '#303136', 
    author: { name: 'COVID Stats by NovelCOVID', url: 'https://cdn.discordapp.com/icons/707227171835609108/f308f34a45ac7644506fb628215a3793.png?size=128' },
    thumbnail: countryData.countryInfo.flag,
    title: `${countryData.country}, ${countryData.continent}`,
    fields: [
      { name: 'Cases', value: `${formatNumber(countryData.cases)}\n(${(countryData.todayCases >= 0 ? "+":"-")+String(Math.abs(countryData.todayCases)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Deaths', value: `${formatNumber(countryData.deaths)}\n(${(countryData.todayDeaths >= 0 ? "+":"-")+String(Math.abs(countryData.todayDeaths)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Active', value: `${formatNumber(countryData.active)}\n(${(countryData.todayActives >= 0 ? "+":"-")+String(Math.abs(countryData.todayActives)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Recovered', value: `${formatNumber(countryData.recovered)}\n(${(countryData.todayRecovereds >= 0 ? "+":"-")+String(Math.abs(countryData.todayRecovereds)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Critical', value: `${formatNumber(countryData.critical)}\n(${(countryData.todayCriticals >= 0 ? "+":"-")+String(Math.abs(countryData.todayCriticals)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Tests', value: `${formatNumber(countryData.tests)}\n(${(countryData.todayTests >= 0 ? "+":"-")+String(Math.abs(countryData.todayTests)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Infection Rate', value: `${(countryData.casesPerOneMillion/10000).toFixed(4)} %`, inline: true },
      { name: 'Fatality rate', value: `${(countryData.deathsPerOneMillion/10000).toFixed(4)} %`, inline: true },
      { name: 'Test rate', value: `${(countryData.testsPerOneMillion/10000).toFixed(4)} %`, inline: true },
      { name: 'Last Updated', value: moment(countryData.updated).fromNow(), inline: true }
    ],
    footer: 'React with ❌ to remove this embed.',
    url: 'https://disease.sh'
  })
  const msg = await message.channel.send(embed)
  await msg.react('❌')
  try {
    if (await msg.awaitReactions((reaction, user) => reaction.emoji.name == '❌' && user.id === message.author.id, { max: 1, time: 60000, errors: ['time'] }))
      throw new Error()
  }catch{
    msg.delete()
  }
}

const graph = async (message, args) => {
  if (args.length < 1)
    return await message.channel.send('Please specify a country name.')
  const lineData = ['global', 'all'].includes(args[0].toLowerCase()) ? {timeline: await api.historical.all({days: -1})} : await api.historical.countries({ country: args[0], days: -1 })
  if (lineData.message) 
    return await message.channel.send(`Could not find '${args[0]}' or it does not have any cases yet.`)
  const datasets = [{
    label: "Cases",
    borderColor: '#ffffff',
    pointBackgroundColor: '#ffffff',
    pointRadius: 2,
    borderWidth: 3,
    data: Object.keys(lineData.timeline.cases).map(key => lineData.timeline.cases[key])
  },
  {
    label: "Deaths",
    borderColor: '#E26363',
    pointBackgroundColor: '#E26363',
    pointRadius: 2,
    borderWidth: 3,
    data: Object.keys(lineData.timeline.deaths).map(key => lineData.timeline.deaths[key])
  },
  {
    label: "Recovered",
    borderColor: '#74D99F',
    pointBackgroundColor: '#74D99F',
    pointRadius: 2,
    borderWidth: 3,
    data: Object.keys(lineData.timeline.recovered).map(key => lineData.timeline.recovered[key])
  },
  {
    label: "Active",
    borderColor: '#FAE29F',
    pointBackgroundColor: '#FAE29F',
    pointRadius: 2,
    borderWidth: 3,
    data: Object.keys(lineData.timeline.cases).map(key => lineData.timeline.cases[key] - lineData.timeline.recovered[key] - lineData.timeline.deaths[key])
  }]
  for (const index in datasets)
    if (datasets[index].data.filter(x => x).length === 0)
      datasets.splice(index, 1)
  buffer = await lineRenderer.renderToBuffer({
    type: 'line',
    data: {
      labels: Object.keys(lineData.timeline.cases),
      datasets
    },
    options: {
      scales: {
        xAxes: [{
          display: true,
          ticks: {
            fontSize: 17.5,
            callback: (label) => moment(label, 'M/D/YY').format('DD MMM'),
            padding: 10
          },
          gridLines: {
            zeroLineColor: '#fff',
            zeroLineWidth: 2
          }
        }],
        yAxes: [{
          display: true,
          type: args[1] === 'log' ? 'logarithmic' : 'linear',
          ticks: {
            fontSize: 17.5,
            callback: formatNumber 
          },
          gridLines: {
            zeroLineColor: '#fff',
            zeroLineWidth: 2
          }
        }]
      },
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          padding: 40,
          fontSize: 30
        }
      }
    }
  })
  const embed = createEmbed({
    color: '#303136',
    author: { name: 'COVID Stats by NovelCOVID', url: 'https://cdn.discordapp.com/icons/707227171835609108/f308f34a45ac7644506fb628215a3793.png?size=128' },
    title: `${lineData.country || 'Global'} Timeline`,
    description: 'Data is provided by John Hopkins University.',
    files: [new Discord.MessageAttachment(buffer, 'graph.png')],
    image: 'attachment://graph.png',
    footer: 'React with ❌ to remove this embed.',
    url: 'https://disease.sh'
  })
  const msg = await message.channel.send(embed)
  await msg.react('❌')
  try {
    if (await msg.awaitReactions((reaction, user) => reaction.emoji.name == '❌' && user.id === message.author.id, { max: 1, time: 60000, errors: ['time'] }))
      throw new Error()
  }catch{
    msg.delete()
  }
}

const overview = async (message, args) => {
  if (args.length < 1)
    return await message.reply('Please specify a country name.')
  const pieData = ['global', 'all'].includes(args[0].toLowerCase()) ? await api.all() : await api.countries({ country: args[0] })
  if(pieData.message) 
    return await message.channel.send(`Could not find '${args[0]}' or it does not have any cases yet.`)
  buffer = await pieRenderer.renderToBuffer({
    type: 'pie',
    data: {
      labels: ['Active', 'Recovered', 'Deaths'],
      datasets: [{
        data: [pieData.active, pieData.recovered, pieData.deaths],
        backgroundColor: ['#FAE29F', '#7FD99F', '#E26363'],
        borderWidth: 0.5,
        borderColor: ['#FAE29F', '#7FD99F', '#E26363']
      }]
    },
    options: {
      legend: {
        display: true,
        labels: {
          padding: 40,
          fontSize: 30
        }
      }
    }
  })
  const embed = createEmbed({
    color: '#303136', 
    author: { name: 'COVID Stats by NovelCOVID', url: 'https://cdn.discordapp.com/icons/707227171835609108/f308f34a45ac7644506fb628215a3793.png?size=128' },
    title: `${pieData.country || 'Global'} Overview`,
    files: [new Discord.MessageAttachment(buffer, 'graph.png')],
    image: 'attachment://graph.png',
    footer: 'React with ❌ to remove this embed.',
    url: 'https://disease.sh'
  })
  const msg = await message.channel.send(embed)
  await msg.react('❌')
  try {
    if (await msg.awaitReactions((reaction, user) => reaction.emoji.name == '❌' && user.id === message.author.id, { max: 1, time: 60000, errors: ['time'] }))
      throw new Error()
  }catch{
    msg.delete()
  }
}

const state = async (message, args) => {
  if (args.length < 1)
    return await message.reply('Please specify a state name.')
  const stateData = await api.states({ state: args[0] })
  const yesterdayStateData = await api.yesterday.states({ state: args[0] })
  if(stateData.message || yesterdayStateData.message) 
    return await message.channel.send(`Could not find '${args[0]}' or it does not have any cases yet.`)
  stateData.todayActives = stateData.active - yesterdayStateData.active
  stateData.todayTests = stateData.tests - yesterdayStateData.tests
  const embed = createEmbed({
    color: '#303136', 
    author: { name: 'COVID Stats by NovelCOVID', url: 'https://cdn.discordapp.com/icons/707227171835609108/f308f34a45ac7644506fb628215a3793.png?size=128' },
    thumbnail: 'https://disease.sh/assets/img/flags/us.png',
    title: `${stateData.state}, USA`,
    fields: [
      { name: 'Cases', value: `${formatNumber(stateData.cases)}\n(${(stateData.todayCases >= 0 ? "+":"-")+String(Math.abs(stateData.todayCases)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Deaths', value: `${formatNumber(stateData.deaths)}\n(${(stateData.todayDeaths >= 0 ? "+":"-")+String(Math.abs(stateData.todayDeaths)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Active', value: `${formatNumber(stateData.active)}\n(${(stateData.todayActives >= 0 ? "+":"-")+String(Math.abs(stateData.todayActives)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Tests', value: `${formatNumber(stateData.tests)}\n(${(stateData.todayTests >= 0 ? "+":"-")+String(Math.abs(stateData.todayTests)).replace(/(.)(?=(\d{3})+$)/g,'$1,')})`, inline: true },
      { name: 'Test rate', value: `${(stateData.testsPerOneMillion/10000).toFixed(4)} %`, inline: true },
      { name: 'Last Updated', value: moment(stateData.updated).fromNow(), inline: true }
    ],
    footer: 'React with ❌ to remove this embed.',
    url: 'https://disease.sh'
  })
  const msg = await message.channel.send(embed)
  await msg.react('❌')
  try {
    if (await msg.awaitReactions((reaction, user) => reaction.emoji.name == '❌' && user.id === message.author.id, { max: 1, time: 60000, errors: ['time'] }))
      throw new Error()
  }catch{
    msg.delete()
  }
}

const leaderboard = async (message, args) => {
  const allData = await api.all()
  const sorter = Object.keys(sortables).includes(args[0] && args[0].toLowerCase()) ? (sortables[args[0].toLowerCase()] || args[0].toLowerCase()) : 'cases'
  const leaderboard = (await api.countries({ sort: sorter })).splice(0, 15)
  const embed = createEmbed({
    color: '#303136',
    author: { name: 'COVID Stats by NovelCOVID', url: 'https://cdn.discordapp.com/icons/707227171835609108/f308f34a45ac7644506fb628215a3793.png?size=128' },
    title: `Top 15 Countries sorted by '${sorter}'`,
    description: leaderboard.map((c, index) => `**${++index}**. ${c.country} \u279C ${(sorter.includes('PerOneMillion') ? String(c[sorter]).replace(/(.)(?=(\d{3})+$)/g,'$1,') : (c[sorter]/allData[sorter]*100).toFixed(2)+' %')}`).join('\n'),
    footer: 'React with ❌ to remove this embed.',
    url: 'https://disease.sh'
  })
  const msg = await message.channel.send(embed)
  await msg.react('❌')
  try {
    if (await msg.awaitReactions((reaction, user) => reaction.emoji.name == '❌' && user.id === message.author.id, { max: 1, time: 60000, errors: ['time'] }))
      throw new Error()
  }catch{
    msg.delete()
  }
}

const mobility = async (message, args) => {
  if (args.length < 1)
    return await message.reply('Please specify a country name.')
  const mobData = await api.apple.mobilityData({ country: args[0], subregion: args[1] || 'All'})
  if(mobData.message) 
    return await message.channel.send(`Could not find '${args[0]}' or it does not have any cases yet.`)
  const datasets = [{
    label: "Walking",
    borderColor: '#FAE29F',
    pointBackgroundColor: '#FAE29F',
    pointRadius: 2,
    borderWidth: 3,
    data: mobData.data.map(x => x.walking || 0)
  },{
    label: "Driving",
    borderColor: '#7FD99F',
    pointBackgroundColor: '#7FD99F',
    pointRadius: 2,
    borderWidth: 3,
    data: mobData.data.map(x => x.driving || 0)
  },{
    label: "Transit",
    borderColor: '#E26363',
    pointBackgroundColor: '#E26363',
    pointRadius: 2,
    borderWidth: 3,
    data: mobData.data.map(x => x.transit || 0)
  }]
  for(const index in datasets)
    if(datasets[index].data.filter(x => x).length === 0)
      datasets.splice(index, 1)
  buffer = await lineRenderer.renderToBuffer({
    type: 'line',
    data: {
      labels: mobData.data.map(x => x.date),
      datasets
    },
    options: {
      scales: {
        xAxes: [{
          display: true,
          ticks: {
            fontSize: 17.5,
            callback: (label) => moment(label, 'YYYY-MM-DD').format('DD MMM'),
            padding: 10
          },
          gridLines: {
            zeroLineColor: '#fff',
            zeroLineWidth: 2
          }
        }],
        yAxes: [{
          display: true,
          ticks: {
            fontSize: 17.5,
            callback: (label) => {
              label += 100
              return `${label == 100 ? '' : (label > 100 ? '+' : '-')}${Math.abs(label-100)} %`
            }
          },
          gridLines: {
            zeroLineColor: '#fff',
            zeroLineWidth: 2
          }
        }]
      },
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          padding: 40,
          fontSize: 30
        }
      }
    }
  })
  const embed = createEmbed({
    color: '#303136',
    author: { name: 'COVID Stats by NovelCOVID', url: 'https://cdn.discordapp.com/icons/707227171835609108/f308f34a45ac7644506fb628215a3793.png?size=128' },
    title: `${mobData.country}, ${mobData.subregion} Mobility Data`,
    description: 'Data is provided by Apple. All values are relative to those from 13th Jan.',
    files: [new Discord.MessageAttachment(buffer, 'graph.png')],
    image: 'attachment://graph.png',
    footer: 'React with ❌ to remove this embed.',
    url: 'https://disease.sh'
  })
  const msg = await message.channel.send(embed)
  await msg.react('❌')
  try {
    if (await msg.awaitReactions((reaction, user) => reaction.emoji.name == '❌' && user.id === message.author.id, { max: 1, time: 60000, errors: ['time'] }))
      throw new Error()
  }catch{
    msg.delete()
  }
}

module.exports = {
  help,
  h: help,
  invite,
  i: invite,
  all,
  a: all,
  country,
  c: country,
  graph,
  g: graph,
  overview,
  o: overview,
  state,
  s: state,
  leaderboard,
  l: leaderboard,
  mobility,
  m: mobility
}