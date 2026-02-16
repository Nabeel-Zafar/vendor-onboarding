module.exports = (srv) => {
    const { User } = srv.entities;

    srv.on('READ', 'User', async (req) => {
        const users = await SELECT.from(User);
        return users;
    });

    srv.on('CREATE', 'User', async (req) => {
        const { data } = req;
        console.log('-----------', data)
        const result = await INSERT.into(User).entries(data);
        return result;
    });
};
