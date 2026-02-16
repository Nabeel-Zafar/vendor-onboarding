using my.app as my from '../db/user';

service UserService {
    entity User as projection on my.User;
}
