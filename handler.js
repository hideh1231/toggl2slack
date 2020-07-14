const axios = require('axios')
const moment = require('moment')
require("moment-duration-format");

exports.handler = async (event, context, callback) => {
  let since = moment().subtract(1, 'day').format('YYYY-MM-DD')
  let until = moment().format('YYYY-MM-DD')
  const res = await axios({
    method: 'get',
    url: process.env.toggl_url,
    auth: {
      username: process.env.toggl_api_token,
      password: 'api_token'
    },
    params: {
      workspace_id: process.env.toggl_workspace_id,
      since: `${since}T05:00:00`,
      until: `${until}T05:00:00`,
      user_agent: process.env.toggl_user_agent
    }
  }).catch((error) => {
    console.log(error)
    throw error
  })

  if (res.data) {
    const obj_data = Object.entries(res.data.data)
    obj_data.map(async (data) => {
      data = data[1]
      start = moment.parseZone(data.start)
      end = moment.parseZone(data.end)
      duration = moment.duration(end.diff(start), "ms")
      const payload = {
        text: data.description,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${data.description}* #808080`
            },
            fields: [
              {
                type: "mrkdwn",
                text: "*Duration*",
              },
              {
                type: "mrkdwn",
                text: " ",
              },
              {
                type: "mrkdwn",
                text: `${duration.format('h:mm:ss', { trim: false })}`,
              },
              {
                type: "mrkdwn",
                text: " ",
              },
              {
                type: "mrkdwn",
                text: "*Start*",
              },
              {
                type: "mrkdwn",
                text: "*End*",
              },
              {
                type: "mrkdwn",
                text: `${start.format('hh:mm')}`,
              },
              {
                type: "mrkdwn",
                text: `${end.format('hh:mm')}`,
              },
            ]
          }
        ]
      }
      if (data.pid) {
        payload.blocks[0].text.text = `*${data.description}* : ${data.project} ${data.project_hex_color}`
        payload.text = `*${data.description}* : ${data.project}`
      }
      await axios({
        method: 'post',
        url: process.env.slack_url,
        headers: {
          "Content-Type": "application/json"
        },
        data: payload
      }).catch((error) => {
        console.log(error)
        throw error
      })
      await callback(null, {
        statusCode: 200,
        body: {}
      });
    })
  }

};
