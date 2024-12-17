import random, datetime

m_fnames = ["John", "James", "Robert", "Michael", "William", "David", "Joseph", "Charles", "Thomas", "Daniel"]
m_lnames = ["Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"]
w_fnames = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"]
w_lnames = ["Williams", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez"]

rand_mname = ''.join(random.sample(m_fnames, 1)) + ' ' + ''.join(random.sample(m_lnames, 1))
rand_wname = ''.join(random.sample(w_fnames, 1)) + ' ' + ''.join(random.sample(w_lnames, 1))

rand_month = random.randint(1, 12)
rand_day = random.randint(1, 30)
rand_year = random.randint(1970, 2024)

today = datetime.date.today()

rand_date = datetime.date(rand_year, rand_month, rand_day) # YYYY-MM-DD
formatted_date = rand_date.strftime("%d/%m/%Y") # DD/MM/YYYY
age = today.year - rand_date.year

print(today)
print(rand_date)
print(age)
print(formatted_date)

# print("Men's Name:", rand_mname)
# print("Women's Name:", rand_wname)