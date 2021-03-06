import os
import flask
from flask import request
from flask_restful import Resource

class ExplorationApi(Resource):

    def post(self):

        dic_input = request.json
        print(dic_input)
        sentence = dic_input['sentence']

        # here compute request thanks to state_of_request
        result = 42
        request_successful = True

        # here the sentences that the bot should print
        sentences = ["the result is the Answer to the Ultimate Question of Life, the Universe, and Everything",
                    'End of exploration mode, returning to normal mode']

        return {'request_successful':request_successful, 'sentences':sentences,'result':42}, 200