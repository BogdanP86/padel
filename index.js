const service_id_list = {
    paddel1: 39707,
    paddel2: 39708
}

const getAvailalbeAppointments = async (cookies, service_id = 39707, daysAdded = 14) => {
    let date = new Date();
    const currentMinute = date.getMinutes()
    console.log('Current minute', currentMinute)
    if (currentMinute !== 55) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getAvailalbeAppointments(cookies, service_id = 39707, daysAdded)
    }
    if (55 === currentMinute) {
        return
    }

    date.setDate(date.getDate() + daysAdded);
    date = Math.floor(date / 1000);

    const availUrl = `https://www.calendis.ro/api/get_available_slots?service_id=${service_id}&location_id=4870&date=${date}`

    const rest = await fetch(availUrl, {
        headers: {
            "Content-Type": "application/json",
            cookie: cookies
        }
    });

    const jsonRes = await rest.json();
    for (item of jsonRes.available_slots) {
        date = new Date(item.time * 1000);
        const appTime = date.getHours();
        console.log('Available time', appTime, 'date', date.getDate(), 'time', item.time)
        if ([19, 20, 21].includes(appTime)) {
            await appointment(cookies, service_id, `${appTime}:00`, 21359, item.time);
        }
    }
    // jsonRes.available_slots.forEach(async (item) => {
       
    // })
    // if(daysAdded !==0) {
    //     return getAvailalbeAppointments(cookies, service_id, daysAdded - 1)
    // }
}

const appointment = async (cookies, service_id = 39707, startTime, staff_id, dateUnix) => {
    const appointments = "https://calendis.ro/api/appointment/";

    const appointmentsData = await fetch(appointments, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            cookie: cookies
        },
        body: JSON.stringify({
            appointments: [{
                dateUnix,
                location_id: 4870,
                service_id,
                staff_id,
                startTime,
                originalSlot: 0
            }],
            group_id: null
        })
    });

    const appointJSON = await appointmentsData.json();
    const { appointment_group_id } = appointJSON;
    return makeAppointment(cookies, appointment_group_id);
} 

const makeAppointment = async (cookies, appointment_group_id) => {
    const makeUrl = `https://www.calendis.ro/appointment/${appointment_group_id}`
    const app = await fetch(makeUrl, {
        method: 'PUT',
         headers: {
            "Content-Type": "application/json",
            cookie: cookies
        },
        body: JSON.stringify({
            clients: [{
                own_appointment: 1, dateUnix: Math.floor(Date.now() / 1000), appointment_id: parseInt(appointment_group_id)
            }]
        })
    });
    console.log('Appointment made', await app.json())
    process.exit(0)
}

const login = async (email, password) => {
    const loginUrl = `https://www.calendis.ro/api/login`;
    const credentials = { email, password, remember: false };
    const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials)
    });

    const cookies = response.headers.get('set-cookie');
    return cookies
}

const main = async () => {
    console.log('Starting appointment booking...');
    try {
        const cookies = await login('preda.bogdan86@gmail.com', 'Master2x1986');
        await getAvailalbeAppointments(cookies, service_id_list.paddel1);
    }
    catch (er) {
        console.log('Error', er)
    }
    return process.exit(0)
}

main()