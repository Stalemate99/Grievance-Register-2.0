import spacy

def sumExtract(text):
    nlp = spacy.load('en_core_web_sm')
    doc = nlp(text)
    wordlist = []
    for word in doc:
        if word.pos_ == 'NOUN':
            wordlist.append(word.text)
        elif word.pos_ == 'VERB':
            wordlist.append(word.text)
    print(wordlist)

sumExtract("There is an open pothole in front of my house.")