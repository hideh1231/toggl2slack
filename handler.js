const axios = require('axios')
const moment = require('moment')
const moment_timezone = require('moment-timezone')
require("moment-duration-format");

exports.handler = async (event, context, callback) => {
  const start_date = moment_timezone().tz('Asia/Tokyo').subtract(2, 'day').hour(5).minutes(0).second(0)
  const end_date = moment_timezone().tz('Asia/Tokyo').subtract(1, 'day').hour(5).minutes(0).second(0)
  const projects = await get_toggl_projects()
  const res = await get_toggl_time_entries(start_date, end_date)
  const res_data = Object.entries(res.data)
  let payload_arr = []
  for (data of res_data) {
    data = data[1]
    const start = moment.parseZone(data.start).tz('Asia/Tokyo')
    const stop = moment.parseZone(data.stop).tz('Asia/Tokyo')
    const duration = moment.duration(stop.diff(start), "ms")
    const payload = make_payload(
      data.description,
      duration.format('hh:mm:ss', { trim: false }),
      start.format('MM/DD HH:mm'),
      stop.format('MM/DD HH:mm'),
      data.pid,
      projects.data
    )
    payload_arr.push(payload)
  }
  payload_arr.sort((a, b) => {
    a_start = a.blocks[0].fields[6].text
    b_start = b.blocks[0].fields[6].text
    if (a_start < b_start) return -1;
    else if (a_start > b_start) return 1;
    else return 0;
  })
  payload_arr.map((payload) => {
    console.log(payload.blocks[0])
    post_slack(payload)
  })
  callback(null, {
    statusCode: 200,
    body: {}
  });
};

const get_toggl_time_entries = async (start_date, end_date) => {
  return await axios.get(
    process.env.toggl_time_entries_api,
    {
      auth: {
        username: process.env.toggl_api_token,
        password: 'api_token'
      },
      params: {
        start_date: `${start_date.format()}`,
        end_date: `${end_date.format()}`,
      }
    }).catch((error) => {
      console.log(error)
      throw error
    })
}

const get_toggl_projects = async () => {
  return await axios.get(
    `${process.env.toggl_projects_api}`,
    {
      auth: {
        username: process.env.toggl_api_token,
        password: 'api_token',
      }
    }).catch((error) => {
      console.log(error)
      throw error
    })
}

const post_slack = async (payload) => {
  return axios.post(process.env.slack_url, payload)
    .catch((error) => {
      console.log(error)
      throw error
    })
}

const make_payload = (description, duration, start, stop, pid, projects) => {
  let payload = {
    text: `*${description}* #808080`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${description}* #808080`
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
            text: duration,
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
            text: start,
          },
          {
            type: "mrkdwn",
            text: stop,
          },
        ]
      }
    ]
  }
  if (pid) {
    for (p_data of projects) {
      if (p_data.id == pid) {
        payload.text = `*${description}* : ${p_data.name} ${p_data.hex_color}`
        payload.blocks[0].text.text = `*${description}* : ${p_data.name} ${p_data.hex_color}`
        break
      }
    }
  }
  return payload
}
