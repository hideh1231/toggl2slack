const axios = require('axios')
const moment = require('moment')
const moment_timezone = require('moment-timezone')
require("moment-duration-format");

exports.handler = async (event, context, callback) => {
  const start_date = moment_timezone().tz('Asia/Tokyo').subtract(1, 'day').hour(5).minutes(0).second(0)
  const end_date = moment_timezone().tz('Asia/Tokyo').hour(5).minutes(0).second(0)
  const date = end_date.format('YYYY/M/D')
  const projects = await get_toggl_projects()
  const res = await get_toggl_time_entries(start_date, end_date)
  const res_data = Object.entries(res.data)
  res_data.sort((a, b) => {
    if (a[1].start < b[1].start) return -1;
    else if (a[1].start > b[1].start) return 1;
    else return 0;
  })
  let payload_arr = []
  for (data of res_data) {
    data = data[1]
    const start = moment.parseZone(data.start).tz('Asia/Tokyo')
    const stop = moment.parseZone(data.stop).tz('Asia/Tokyo')
    const duration = moment.duration(stop.diff(start), "ms")
    const payload = make_payload(
      data.description,
      duration.format('h:mm:ss', { trim: false }),
      start.format('h:mm A'),
      stop.format('h:mm A'),
      data.pid,
      projects.data
    )
    payload_arr.push(payload)
  };
  payload_arr.push({
    text: `${date}`,
    blocks: [
      {
        "type": "divider"
      }
    ]
  });
  (async () => {
    for (payload of payload_arr) {
      console.log(payload)
      await post_slack(payload)
    }
  })();
};

const get_toggl_time_entries = (start_date, end_date) => {
  return axios.get(
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

const post_slack = (payload) => {
  return axios.post(process.env.slack_url, payload)
    .catch((error) => {
      console.log(error)
      throw error
    })
}

const make_payload = (description, duration, start, stop, pid, projects) => {
  let payload = {
    text: description,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${description}* #808080\n${start} - ${stop} (${duration})`
        },
      }
    ]
  }
  if (pid) {
    for (p_data of projects) {
      if (p_data.id == pid) {
        payload.text = `*${description}* : ${p_data.name}`
        payload.blocks[0].text.text = `*${description}* : ${p_data.name} ${p_data.hex_color}\n${start} - ${stop} (${duration})`
        break
      }
    }
  }
  return payload
}
