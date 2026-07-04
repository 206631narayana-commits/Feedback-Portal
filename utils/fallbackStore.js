import crypto from 'crypto';

const memoryState = {
  students: [],
  admins: [],
};

const normalizeStudent = (student) => ({
  ...student,
  _id: student._id || crypto.randomUUID(),
  createdAt: student.createdAt || new Date().toISOString(),
  updatedAt: student.updatedAt || new Date().toISOString(),
});

export const createStudentRecord = async (data) => {
  const student = normalizeStudent({
    ...data,
    submissionDate: data.submissionDate || new Date().toISOString(),
  });
  memoryState.students.push(student);
  return student;
};

export const findStudentByEmail = async (email) => {
  return memoryState.students.find((student) => student.email === email) || null;
};

export const listStudents = async () => {
  return [...memoryState.students].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getStudentById = async (id) => {
  return memoryState.students.find((student) => student._id === id) || null;
};

export const updateStudentById = async (id, updates) => {
  const index = memoryState.students.findIndex((student) => student._id === id);
  if (index === -1) return null;

  memoryState.students[index] = {
    ...memoryState.students[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return memoryState.students[index];
};

export const deleteStudentById = async (id) => {
  const index = memoryState.students.findIndex((student) => student._id === id);
  if (index === -1) return null;
  const [deletedStudent] = memoryState.students.splice(index, 1);
  return deletedStudent;
};

export const createAdminRecord = async (data) => {
  const admin = {
    _id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoryState.admins.push(admin);
  return admin;
};

export const findAdminByEmail = async (email) => {
  return memoryState.admins.find((admin) => admin.email === email) || null;
};
