from dotenv import load_dotenv
from pymongo import MongoClient
import os

CONFIG_DIR = './configs/'
load_dotenv(CONFIG_DIR + '.env.mongo')

MONGO_URI = os.getenv('CONNECTION_STRING')

client = MongoClient(MONGO_URI)
print(os.getenv('DATABASE'))
# db = client[os.getenv("DATABASE")]
# collection = [os.getenv('COLLECTION_1')]

test1 = os.getenv('USERNAME')
print(test1)

test2 = os.getenv('PASSWORD')
print(test2)

# document = collection.find_one()
# print(document)