import os
import flask
from flask import request
from flask_restful import Resource

class SpecifyApi(Resource):

    def post(self):

        dic_input = request.json
        print(dic_input)
        sentence = dic_input['sentence']
        state_of_request = dic_input['state_of_request']

        # Treat sentence here (by regexp)
        words = sentence.split(' ')
        if 'ready' in words or 'ready' in state_of_request:
            ready = True
        else:
            ready = False

        addedSpecs = {}
        k = 0
        for word in words:
            addedSpecs[word] = k
            k += 1

        # here we should store the specifications of the user, then return all the specifications over
        # the different requests
        state_of_request.update(addedSpecs)
        print(state_of_request)

        # here the sentences that the bot should print
        sentences = ["info about your request: it's very intelligent",
                    'Please provide the following fields to continue: toto, tata, titi']

        return {'addedSpecs':addedSpecs, 'state_of_request':state_of_request, 'sentences':sentences,'ready':ready}, 200