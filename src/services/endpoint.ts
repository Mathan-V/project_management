export const API_ENDPOINTS = {
    AUTH: {
        SIGNIN: '/auth/signin',
        SIGNUP: '/auth/signup'
    },
    USERS: {
        GET_ALL: '/user',
        CREATE: '/user',
        GET_SINGLE: '/user/{user_name}',
        UPDATE: '/user/{user_name}',
        DELETE: '/user/{user_name}',
    },
    ROLES: {
        GET_ALL: '/role',
        CREATE: '/role',
        GET_SINGLE : '/role/{role_id}',
        UPDATE : '/role/{role_id}',
        DELETE : '/role/{role_id}',
        UPDATE_PERMISSIONS: '/roles/{role_id}/permissions/',
        GET_PERMISSIONS: '/roles/{role_id}/permissions/',
    },
    CLIENTS: {
        GET_ALL: '/clients',
        CREATE: '/clients',
        GET_SINGLE : '/clients/{client_id}',
        UPDATE : '/clients/{client_id}',
        DELETE : '/clients/{client_id}'
    },
    PROJECTS:{
        GET_ALL: '/projects',
        CREATE: '/projects',
        GET_SINGLE : '/projects/{project_id}',
        UPDATE : '/projects/{project_id}',
        DELETE : '/projects/{project_id}'
    },
    TIMESHEET : {
        GET_ALL: '/timesheet/project/{project_id}',
        GET_ALL_TIMESHEET : '/timesheet',
        CREATE: '/timesheet',
        GET_SINGLE : '/timesheet/{timesheet_id}',
        UPDATE : '/timesheet/{timesheet_id}',
        DELETE : '/timesheet/{timesheet_id}'
    },
    PERMISSIONS:{
        GET_ALL : '/permission',
        CREATE: '/permission',
        GET_SINGLE : '/permission/{permission_id}',
        UPDATE : '/permission/{permission_id}',
        DELETE : '/permission/{permission}'
    }

}