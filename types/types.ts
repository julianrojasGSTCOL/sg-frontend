// El backend (sg-backend) devuelve JSON crudo, sin envelope { data, success, ... }.
// Se mantiene este alias para no acoplar cada `server/*` a la forma exacta del
// wrapper si algún día se introduce uno (login, paginación estándar, etc.).
export type ApiResponse<T> = T;
