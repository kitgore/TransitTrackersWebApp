export const mails = [
  {
    id: "6c84fb90-12c4-11e1-840d-7b25c5ee775a",
    name: "Ben Griepp",
    email: "bengriepp@example.com",
    text: "Sounds good!",
    date: "2025-03-03T15:47:00",
    read: true,
  },
  {
    id: "110e8400-e29b-11d4-a716-446655440000",
    name: "Drake Stanton",
    email: "drake@example.com",
    text: "Busses are awesome",
    date: "2025-03-01T10:30:00",
    read: true,
  },
  {
    id: "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2",
    name: "Lauren Bushman",
    email: "lauren@example.com",
    text: "Got busses?",
    date: "2025-02-28T11:45:00",
    read: true,
  },
  {
    id: "61c35085-72d7-42b4-8d62-738f700d4b92",
    name: "Alonso Jimenez Alamilla",
    email: "alonso@example.com",
    text: "I love busses!",
    date: "2025-02-28T13:15:00",
    read: false,
  }
]

export type Mail = (typeof mails)[number]


