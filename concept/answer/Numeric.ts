import * as answer_pb from "grakn-protocol/protobuf/answer_pb";
import {GraknClientError} from "../../common/errors/GraknClientError";
import {ErrorMessage} from "../../common/errors/ErrorMessage";

export class Numeric {
    private readonly _numberValue?: number;

    private constructor(numberValue?: number) {
        this._numberValue = numberValue;
    }

    public static of(answer: answer_pb.Numeric): Numeric {
        switch (answer.getValueCase()) {
            case answer_pb.Numeric.ValueCase.LONG_VALUE:
                return Numeric.ofNumber(answer.getLongValue());
            case answer_pb.Numeric.ValueCase.DOUBLE_VALUE:
                return Numeric.ofNumber(answer.getDoubleValue());
            case answer_pb.Numeric.ValueCase.NAN:
                return Numeric.ofNaN();
            default:
                throw new GraknClientError(ErrorMessage.Query.BAD_ANSWER_TYPE.message(answer.getValueCase()));
        }
    }

    public isNumber(): boolean {
        return this._numberValue != null;
    }

    public isNaN(): boolean {
        return !this.isNumber();
    }

    public asNumber(): number {
        if (this.isNumber()) return this._numberValue;
        else throw new GraknClientError(ErrorMessage.Query.ILLEGAL_CAST.message("NaN", "number"));
    }

    private static ofNumber(value: number): Numeric {
        return new Numeric(value);
    }

    private static ofNaN(): Numeric {
        return new Numeric(null);
    }
}
